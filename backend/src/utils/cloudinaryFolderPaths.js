import { env } from '../config/env.js';

// The environment segment keeps development and test uploads away from live images.
const CLOUDINARY_ROOT_FOLDER = `laadlibytes/${env.NODE_ENV}`;

// A public id may not contain spaces or most punctuation, so anything else becomes a hyphen.
const toCloudinaryFolderSegment = (value) => String(value).trim().replace(/[^A-Za-z0-9_-]+/g, '-');

/** laadlibytes/<env>/products/<SKU> */
export const buildProductImageFolderPath = (sku) =>
  `${CLOUDINARY_ROOT_FOLDER}/products/${toCloudinaryFolderSegment(String(sku).toUpperCase())}`;

/** laadlibytes/<env>/categories/<slug> */
export const buildCategoryImageFolderPath = (slug) =>
  `${CLOUDINARY_ROOT_FOLDER}/categories/${toCloudinaryFolderSegment(slug)}`;

export default buildProductImageFolderPath;