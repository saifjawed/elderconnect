import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Configure the Cloudinary SDK from environment variables.
// Uploads are performed server-side (signed) so the API secret never reaches the browser.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// True only when all three credentials are present. Routes use this to fail fast
// with a clear message instead of a cryptic Cloudinary error when unconfigured.
export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export const AVATAR_FOLDER = 'nestlife/avatars';

export default cloudinary;
