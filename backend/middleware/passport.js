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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // ✅ MUST be absolute
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email || !email.endsWith("@snu.edu.in")) {
          return done(null, false);
        }

        let user = await Student.findOne({ snu_email_id: email });

        if (!user) {
          user = await Student.create({
            s_name: profile.displayName,
            snu_email_id: email,
            googleId: profile.id,
            authProvider: "google",
          });
        }

        return done(null, user);
      } catch (err) {
        console.error("GOOGLE STRATEGY ERROR:", err);
        return done(err);
      }
    }
  )
);

export default passport;
