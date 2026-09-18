/**
 * Upload rules shared by the admin upload middleware and the catalogue seeder, so an image
 * that the seeder accepts is always one the API would accept too.
 */
export const MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES = 5 * 1024 * 1024;
export const MAXIMUM_PRODUCT_IMAGE_FILES_PER_REQUEST = 10;
export const MAXIMUM_CATEGORY_IMAGE_FILES_PER_REQUEST = 1;

export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];
export const ALLOWED_IMAGE_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

/** For messages: "PNG, JPG, WEBP or AVIF". */
export const ALLOWED_IMAGE_FORMATS_LABEL = 'PNG, JPG, WEBP or AVIF';

// The first bytes of the file. The mimetype a client declares is only a claim; these are not.
const PNG_FILE_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_FILE_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
// WebP: "RIFF" <4-byte size> "WEBP"
const WEBP_RIFF_MARKER = Buffer.from('RIFF', 'ascii');
const WEBP_FORMAT_MARKER = Buffer.from('WEBP', 'ascii');
// AVIF: <4-byte box size> "ftyp" <major brand>; "avif" for still images, "avis" for sequences.
const AVIF_FILE_TYPE_BOX_MARKER = Buffer.from('ftyp', 'ascii');
const AVIF_MAJOR_BRANDS = ['avif', 'avis'];

// WebP and AVIF are only recognisable from byte 8 to byte 11, so 12 bytes are read.
export const IMAGE_FILE_SIGNATURE_LENGTH_IN_BYTES = 12;

const bytesAt = (fileBytes, start, length) => fileBytes.subarray(start, start + length);

/** Returns 'image/png', 'image/jpeg', 'image/webp', 'image/avif', or null for anything else. */
export function detectImageMimeTypeFromFileSignature(fileBytes) {
  if (!Buffer.isBuffer(fileBytes)) return null;
  if (bytesAt(fileBytes, 0, PNG_FILE_SIGNATURE.length).equals(PNG_FILE_SIGNATURE)) return 'image/png';
  if (bytesAt(fileBytes, 0, JPEG_FILE_SIGNATURE.length).equals(JPEG_FILE_SIGNATURE)) return 'image/jpeg';
  if (bytesAt(fileBytes, 0, 4).equals(WEBP_RIFF_MARKER) && bytesAt(fileBytes, 8, 4).equals(WEBP_FORMAT_MARKER)) {
    return 'image/webp';
  }
  if (
    bytesAt(fileBytes, 4, 4).equals(AVIF_FILE_TYPE_BOX_MARKER) &&
    AVIF_MAJOR_BRANDS.includes(bytesAt(fileBytes, 8, 4).toString('ascii'))
  ) {
    return 'image/avif';
  }
  return null;
}

export default detectImageMimeTypeFromFileSignature;