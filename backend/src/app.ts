import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import helmet from "helmet";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import yaml from "yamljs";
import "./config/passport";
import authRouter from "./modules/auth/auth.route";
import coursessRouter from "./modules/courses/course.route";
import postsRouter from "./modules/posts/post.routes";
import resourcesRouter from "./modules/resources/resources.route";
import staffRequestsRouter from "./modules/staffRequests/staffRequests.routes";
import studentRequestsRouter from "./modules/studentRequests/studentRequests.routes";
import tracksRouter from "./modules/tracks/tracks.routes";import meetingsRouter from "./modules/meetings/meeting.route";import userRouter from "./modules/users/user.route";
import {errorHandler} from "./utils/errorHandler"; 
const app = express();

app.use(helmet());

const limiter = rateLimit({
  limit: 150,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api-docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const swaggerDocument = yaml.parse(fs.readFileSync("./swagger.yaml", "utf8"));
  swaggerUi.setup(swaggerDocument, { explorer: true })(req, res, next);
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/tracks", tracksRouter);
app.use("/api/v1/courses", coursessRouter);
app.use("/api/v1/staff-requests", staffRequestsRouter);
app.use("/api/v1/student-requests", studentRequestsRouter);
app.use("/api/v1/meetings", meetingsRouter);
app.use("/api/v1/courses/:courseId/posts", postsRouter);
app.use("/api/v1/courses/:courseId/resources", resourcesRouter);
app.use(errorHandler);

export default app;
// {
//   "username": "Clementine",
  // "email": "amer.live477@gmail.com",
  // "password": "newPassword@",
//   "role": "ADMIN"
// }

// {
//   "username": "Lee",
  // "email": "amrsouriya477@gmail.com",
  // "password": "clem1234%$",
//   "role": "ADMIN"
// }

// {
//   "username": "Lee",
//   "email": "amrsouriya477@gmail.com",
//   "password": "clem1234%$",
//   "role": "ADMIN"
// }

// {
//   "name": "test course",
//   "description": "test description",
//   "trackId": "83f00ecd-3053-44c9-b453-296635346c27",
//   "instructorIds": [
//     "46d2d81d-d735-4685-ae8b-546028a108fd"
//   ],
//   "assistantIds": []
// }