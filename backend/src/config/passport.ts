import { Request } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy } from "passport-jwt";
import prisma from "../config/db";

const clientID = process.env.GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const callbackURL = process.env.GOOGLE_CALLBACK_URL!;

const cookieExtractor = (req: Request) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"];
  }
  return token;
};

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: payload.id } });
        if (user) return done(null, user);
        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    { clientID, clientSecret, callbackURL, passReqToCallback: true },
    async (req, _accessToken, _refreshToken, profile, done) => {
      const role = JSON.parse(String(req.query.state)).instructor;
      try {
        let user = await prisma.user.findFirst({
          where: { email: profile.emails?.[0].value.toLowerCase() },
        });
        if (user) {
          // Attach the Google ID to an existing user
          if (role && user.role !== role) {
            return done(new Error("Role mismatch"));
          }
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, emailConfirmed: true },
            });
          }
          return done(null, user);
        } else {
          const newUser = await prisma.user.create({
            data: {
              email: profile.emails?.[0].value!,
              username: profile.displayName,
              googleId: profile.id,
              emailConfirmed: true,
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
