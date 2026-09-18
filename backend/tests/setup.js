/**
 * Runs before each test file, ahead of any import of src/config/env.js.
 * dotenv never overrides variables that are already set, so these values win over a
 * developer's .env: tests never need real secrets and never reach a real SMTP or SMS provider.
 */
process.env.JWT_ACCESS_SECRET ??= 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret_at_least_32_characters_long';
process.env.OTP_SECRET ??= 'test_otp_secret_at_least_32_characters_long_xx';
// Integration tests connect to mongodb-memory-server directly; this only satisfies env validation.
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/laadlibytes-test';
// A well-formed fake; tests that upload mock the storage module, so it is never used on the wire.
process.env.CLOUDINARY_URL ??= 'cloudinary://test_api_key:test_api_secret@test-cloud';
process.env.EMAIL_PROVIDER = 'console';
process.env.SMS_PROVIDER = 'console';