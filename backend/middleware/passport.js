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
          return done(null, false, { message: "SNU email required" });
        }

        const user = await Student.findOne({ snu_email_id: email });

        if (!user) {
          // Do NOT auto-create: Student schema needs many required fields.
          // Frontend should route the user to a completion screen to finish signup.
          return done(null, false, { message: "User not found. Complete signup." });
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
