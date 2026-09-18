import { v2 as cloudinary } from 'cloudinary';

import { env } from '../../config/env.js';

// env.js has already checked the format, so this parse cannot fail.
const cloudinaryConnectionUrl = new URL(env.CLOUDINARY_URL);

/**
 * The one configured SDK instance. The API key and secret stay on the server: they are only
 * used to sign upload and delete calls, and never appear in a response.
 */
cloudinary.config({
  cloud_name: cloudinaryConnectionUrl.hostname,
  api_key: decodeURIComponent(cloudinaryConnectionUrl.username),
  api_secret: decodeURIComponent(cloudinaryConnectionUrl.password),
  secure: true,
});

export const cloudinaryClient = cloudinary;

export default cloudinaryClient;