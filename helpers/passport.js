import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { settings } from "../settings.js";
import { User } from "../db/models/users.js";

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: settings.googleClientId,
      clientSecret: settings.googleClientSecret,
      callbackURL: settings.googleCallbackUrl,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;
        const avatarURL = profile.photos?.[0]?.value || null;

        // Check if user exists by googleId
        let user = await User.findOne({ where: { googleId } });

        if (user) {
          // User exists with this Google account
          return done(null, user);
        }

        // Check if user exists by email (to link existing accounts)
        user = await User.findOne({ where: { email } });

        if (user) {
          // Link Google account to existing user
          user.googleId = googleId;
          if (!user.avatarURL && avatarURL) {
            user.avatarURL = avatarURL;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user with Google account
        user = await User.create({
          email,
          googleId,
          name,
          avatarURL,
          password: null, // No password for OAuth users
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
