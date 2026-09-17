import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { User } from '../src/modules/user/user.model.js';
import { identifierFilter, maskIdentifier, parseIdentifier } from '../src/utils/identifier.js';

/**
 * Gives an existing account the admin role. Sign up through the API first, then:
 *
 *   npm run promote-admin -- you@example.com
 *   npm run promote-admin -- 9876543210
 *
 * The role is read from the access token, so the user must sign in again afterwards.
 */
async function promoteUserToAdmin() {
  const rawIdentifier = process.argv.slice(2).join(' ').trim();
  if (!rawIdentifier) throw new Error('Usage: npm run promote-admin -- <email or Indian mobile number>');

  const parsedIdentifier = parseIdentifier(rawIdentifier);
  if (!parsedIdentifier) throw new Error(`"${rawIdentifier}" is neither a valid email nor an Indian mobile number`);

  await connectDB();
  try {
    const promotedUser = await User.findOneAndUpdate(
      identifierFilter(parsedIdentifier),
      { $set: { role: 'admin' } },
      { returnDocument: 'after' }
    );
    if (!promotedUser) {
      throw new Error(`No account for ${maskIdentifier(parsedIdentifier)}; sign up through the API first`);
    }
    logger.info(`${maskIdentifier(parsedIdentifier)} is now an admin. Sign in again to get an admin token.`);
  } finally {
    await disconnectDB();
  }
}

promoteUserToAdmin().catch((promotionError) => {
  logger.error(`promote-admin failed: ${promotionError.message}`);
  process.exitCode = 1;
});