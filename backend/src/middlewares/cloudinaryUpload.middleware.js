import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { logger } from '../config/logger.js';
import {
  deleteCloudinaryAssetsByPublicIds,
  uploadImageBufferToCloudinary,
} from '../integrations/storage/cloudinaryImageStorage.js';
import { categoryService } from '../modules/category/category.service.js';
import { productService } from '../modules/product/product.service.js';
import { ApiError } from '../utils/ApiError.js';
import { buildCategoryImageFolderPath, buildProductImageFolderPath } from '../utils/cloudinaryFolderPaths.js';
import {
  ALLOWED_IMAGE_FORMATS_LABEL,
  ALLOWED_IMAGE_MIME_TYPES,
  MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES,
  detectImageMimeTypeFromFileSignature,
} from '../utils/imageFileRules.js';
import { slugify } from '../utils/slug.js';

import { stripMongoOperators } from './sanitize.js';

// The JSON form field that carries every non-file field; 100 KB is far above any real product.
const MAXIMUM_FIELDS_JSON_SIZE_IN_BYTES = 100 * 1024;
const MAXIMUM_NON_FILE_FORM_FIELDS = 5;

const isMultipartRequest = (req) => Boolean(req.is('multipart/form-data'));

function convertMulterErrorToApiError(multerError, fileFieldName, maximumFileCount) {
  const megabyteLimit = MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES / (1024 * 1024);

  switch (multerError.code) {
    case 'LIMIT_FILE_SIZE':
      return new ApiError(StatusCodes.REQUEST_TOO_LONG, `Each image must be ${megabyteLimit} MB or smaller`, {
        code: 'IMAGE_TOO_LARGE',  
        cause: multerError,
      });
    case 'LIMIT_FILE_COUNT':
      return ApiError.badRequest(`At most ${maximumFileCount} image file(s) per request`, {
        code: 'TOO_MANY_IMAGES',
        cause: multerError,
      });
    case 'LIMIT_UNEXPECTED_FILE':
      // multer raises this both for a wrong field name and for one file too many on the right one.
      return multerError.field === fileFieldName
        ? ApiError.badRequest(`At most ${maximumFileCount} image file(s) per request`, {
            code: 'TOO_MANY_IMAGES',
            cause: multerError,
          })
        : ApiError.badRequest(`Image files must be sent in the "${fileFieldName}" field`, {
            code: 'UNEXPECTED_IMAGE_FIELD',
            cause: multerError,
          });
    default:
      return ApiError.badRequest(`Invalid multipart request: ${multerError.message}`, {
        code: 'INVALID_MULTIPART',
        cause: multerError,
      });
  }
}

/**
 * Parses a multipart request into memory: files land on req.files, nothing touches the disk.
 * A JSON request passes straight through, so the same route serves both.
 */
export function parseMultipartImageFiles({ fileFieldName, maximumFileCount }) {
  const multipartImageParser = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES,
      files: maximumFileCount,
      fields: MAXIMUM_NON_FILE_FORM_FIELDS,
      fieldSize: MAXIMUM_FIELDS_JSON_SIZE_IN_BYTES,
    },
  }).array(fileFieldName, maximumFileCount);

  return (req, res, next) => {
    if (!isMultipartRequest(req)) return next();

    return multipartImageParser(req, res, (parseError) => {
      if (!parseError) return next();
      if (parseError instanceof multer.MulterError) {
        return next(convertMulterErrorToApiError(parseError, fileFieldName, maximumFileCount));
      }
      return next(parseError);
    });
  };
}

/** Accepts PNG, JPEG, WebP and AVIF only, judged by the declared type *and* the file's own first bytes. */
export function rejectNonPngOrJpegFiles(req, _res, next) {
  const rejectedFileNames = (req.files ?? [])
    .filter((uploadedFile) => {
      const detectedMimeType = detectImageMimeTypeFromFileSignature(uploadedFile.buffer);
      return !ALLOWED_IMAGE_MIME_TYPES.includes(uploadedFile.mimetype) || detectedMimeType !== uploadedFile.mimetype;
    })
    .map((uploadedFile) => uploadedFile.originalname);

  if (rejectedFileNames.length) {
    return next(
      ApiError.badRequest(`Only ${ALLOWED_IMAGE_FORMATS_LABEL} images are allowed`, {
        code: 'UNSUPPORTED_IMAGE_TYPE',
        details: rejectedFileNames.map((fileName) => ({
          field: 'files',
          message: `${fileName} is not a ${ALLOWED_IMAGE_FORMATS_LABEL} image`,
        })),
      })
    );
  }
  return next();
}

/**
 * Form fields are always text, so a multipart request carries every non-file field as one JSON
 * string in `jsonFieldName`. It becomes req.body here, which lets validate() apply the exact
 * schema a JSON request gets. sanitizeRequest ran before multer, so operators are stripped here.
 */
export function parseJsonFieldsFromMultipartBody(jsonFieldName) {
  return (req, _res, next) => {
    if (!isMultipartRequest(req)) return next();

    const { [jsonFieldName]: fieldsJsonText, ...unexpectedFormFields } = req.body ?? {};

    const unexpectedFormFieldNames = Object.keys(unexpectedFormFields);
    if (unexpectedFormFieldNames.length) {
      return next(
        ApiError.badRequest(`Send every non-file field inside the "${jsonFieldName}" JSON field`, {
          code: 'INVALID_FIELDS_JSON',
          details: unexpectedFormFieldNames.map((fieldName) => ({ field: fieldName, message: 'Unexpected form field' })),
        })
      );
    }

    if (fieldsJsonText === undefined || fieldsJsonText === '') {
      req.body = {};
      return next();
    }

    let parsedFields;
    try {
      parsedFields = JSON.parse(fieldsJsonText);
    } catch (jsonError) {
      return next(
        ApiError.badRequest(`"${jsonFieldName}" is not valid JSON`, { code: 'INVALID_FIELDS_JSON', cause: jsonError })
      );
    }

    if (parsedFields === null || typeof parsedFields !== 'object' || Array.isArray(parsedFields)) {
      return next(ApiError.badRequest(`"${jsonFieldName}" must be a JSON object`, { code: 'INVALID_FIELDS_JSON' }));
    }

    req.body = stripMongoOperators(parsedFields);
    return next();
  };
}

/**
 * Registered before the upload. Once the response is sent, an error status means nothing was
 * saved, so every file this request uploaded is deleted again. That covers failures that only
 * the service can detect after the upload: duplicate SKU, missing category, price above MRP.
 */
export function deleteUploadedImagesWhenRequestFails(req, res, next) {
  res.once('finish', () => {
    const uploadedImages = req.uploadedCloudinaryImages ?? [];
    if (res.statusCode < StatusCodes.BAD_REQUEST || uploadedImages.length === 0) return;

    logger.info(`Request failed with ${res.statusCode}; deleting ${uploadedImages.length} uploaded image(s)`, {
      requestId: req.id,
    });
    deleteCloudinaryAssetsByPublicIds(uploadedImages.map((uploadedImage) => uploadedImage.publicId));
  });
  next();
}

/**
 * Uploads req.files in parallel and exposes them as req.uploadedCloudinaryImages = [{ url, publicId }],
 * in the order the files were sent. All or nothing: if one upload fails, the ones that
 * succeeded are deleted before the request fails.
 */
function createCloudinaryImageUploadMiddleware(resolveCloudinaryFolderPath) {
  return async (req, _res, next) => {
    req.uploadedCloudinaryImages = [];
    const filesToUpload = req.files ?? [];
    if (filesToUpload.length === 0) return next();

    try {
      const cloudinaryFolderPath = await resolveCloudinaryFolderPath(req);

      const uploadOutcomes = await Promise.allSettled(
        filesToUpload.map((fileToUpload) => uploadImageBufferToCloudinary(fileToUpload.buffer, cloudinaryFolderPath))
      );

      const successfulUploads = uploadOutcomes
        .filter((uploadOutcome) => uploadOutcome.status === 'fulfilled')
        .map((uploadOutcome) => uploadOutcome.value);
      const firstUploadFailure = uploadOutcomes.find((uploadOutcome) => uploadOutcome.status === 'rejected');

      if (firstUploadFailure) {
        await deleteCloudinaryAssetsByPublicIds(successfulUploads.map((uploadedImage) => uploadedImage.publicId));
        return next(
          new ApiError(StatusCodes.BAD_GATEWAY, 'Image upload failed; nothing was saved', {
            code: 'IMAGE_UPLOAD_FAILED',
            cause: firstUploadFailure.reason,
          })
        );
      }

      req.uploadedCloudinaryImages = successfulUploads;
      return next();
    } catch (folderResolutionError) {
      return next(folderResolutionError);
    }
  };
}

// Update requests may omit the SKU, so the folder then comes from the stored product.
export const uploadProductImagesToCloudinary = createCloudinaryImageUploadMiddleware(async (req) =>
  buildProductImageFolderPath(req.body.sku ?? (await productService.getSkuById(req.params.id)))
);

export const uploadCategoryImageToCloudinary = createCloudinaryImageUploadMiddleware(async (req) => {
  if (req.params.id && !req.body.slug) {
    return buildCategoryImageFolderPath(await categoryService.getSlugById(req.params.id));
  }
  return buildCategoryImageFolderPath(slugify(req.body.slug ?? req.body.name));
});

export default parseMultipartImageFiles;