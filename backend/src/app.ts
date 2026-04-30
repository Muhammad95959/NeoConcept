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
import commentRouter from "./modules/comments/comment.route";
import communityRouter from "./modules/community/community.route";
import courseRouter from "./modules/courses/course.route";
import meetingRouter from "./modules/meetings/meeting.route";
import postRouter from "./modules/posts/post.routes";
import quizRouter from "./modules/quiz/quiz.routes";
import resourceRouter from "./modules/resources/resource.route";
import staffRequestRouter from "./modules/staffRequests/staffRequests.routes";
import studentRequestRouter from "./modules/studentRequests/studentRequests.routes";
import trackRouter from "./modules/tracks/tracks.routes";
import userRouter from "./modules/users/user.route";
import analyticsRouter from "./modules/analytics/analytics.route";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./utils/errorHandler";
const app = express();

app.use(helmet());

const limiter = rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP, please try again later.",
});

// ! Removing the rate limiter for now to avoid issues during development and testing. We can re-enable it later when we are ready to deploy.
// app.use("/api", limiter);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(requestLogger);

app.use("/api-docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const swaggerDocument = yaml.parse(fs.readFileSync("./swagger.yaml", "utf8"));
  swaggerUi.setup(swaggerDocument, { explorer: true })(req, res, next);
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/tracks", trackRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/staff-requests", staffRequestRouter);
app.use("/api/v1/student-requests", studentRequestRouter);
app.use("/api/v1/courses/:courseId/meetings", meetingRouter);
app.use("/api/v1/courses/:courseId/posts", postRouter);
app.use("/api/v1/courses/:courseId/posts/:postId/comments", commentRouter);
app.use("/api/v1/courses/:courseId/quizzes", quizRouter);
app.use("/api/v1/courses/:courseId/resources", resourceRouter);
app.use("/api/v1/courses/:courseId/community", communityRouter);
app.use("/api/v1/courses/:courseId/analytics", analyticsRouter);
app.use(errorHandler);

export default app;
