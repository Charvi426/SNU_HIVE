import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Student from "../models/Student.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();

        // Only allow SNU emails
        if (!email.endsWith("@snu.edu.in")) {
          return done(null, false, { message: "Unauthorized domain" });
        }

        let user = await Student.findOne({ snu_email_id: email });

        if (!user) {
          user = await Student.create({
            s_name: profile.displayName,
            snu_email_id: email,
            googleId: profile.id,
            authProvider: "google",
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          user.authProvider = "google";
          await user.save();
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export default passport;
