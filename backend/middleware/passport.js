import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Student from "../models/Student.js";

console.log("🧪 GOOGLE STRATEGY ENV CHECK:", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
    ? "SET"
    : "MISSING",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
});

// Only initialize Google Strategy if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase() || "";
          console.log("Google OAuth: checking email", email);

          if (!email) {
            return done(null, false, { message: "Google account has no email" });
          }

          const user = await Student.findOne({ snu_email_id: email });

          if (!user) {
            return done(null, false, { message: "No student record found for this email" });
          }

          return done(null, user);
        } catch (err) {
          console.error("GOOGLE STRATEGY ERROR:", err);
          return done(err);
        }
      }
    )
  );
  console.log("✅ Google OAuth Strategy initialized successfully");
} else {
  console.error("❌ Google OAuth credentials missing - Google auth will not work");
}

export default passport;
