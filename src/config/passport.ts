import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const clientID = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const callbackURL = "http://localhost:9595/api/v1/auth/google/callback";

passport.use(
  new GoogleStrategy(
    { clientID, clientSecret, callbackURL, passReqToCallback: true },
    async (req, _accessToken, _refreshToken, profile, done) => {
      const role = JSON.parse(String(req.query.state)).instructor;
      try {
        let user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value.toLowerCase() },
        });
        if (user) {
          // Attach the Google ID to an existing user
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          }
          return done(null, user);
        } else {
          const newUser = await prisma.user.create({
            data: {
              email: profile.emails?.[0].value!,
              username: profile.displayName,
              googleId: profile.id,
              role,
            },
          });
          return done(null, newUser);
        }
      } catch (err) {
        return done(err);
      }
    },
  ),
);
