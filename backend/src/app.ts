import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import yaml from "yamljs";
import "./config/passport";
import authRouter from "./modules/auth/auth.routes";
import coursessRouter from "./modules/courses/courses.routes";
import postsRouter from "./modules/posts/posts.routes";
import resourcesRouter from "./modules/resources/resources.routes";
import tracksRouter from "./modules/tracks/tracks.routes";
import usersRouter from "./modules/users/users.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api-docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const swaggerDocument = yaml.parse(fs.readFileSync("./swagger.yaml", "utf8"));
  swaggerUi.setup(swaggerDocument, { explorer: true })(req, res, next);
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/tracks", tracksRouter);
app.use("/api/v1/courses", coursessRouter);
app.use("/api/v1/courses/:courseId/posts", postsRouter);
app.use("/api/v1/courses/:courseId/resources", resourcesRouter);

export default app;
