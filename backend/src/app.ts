import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import passport from "passport";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import swaggerUi from "swagger-ui-express";
import yaml from "yamljs";
import "./config/passport";
import authRouter from "./modules/auth/auth.routes";
import coursessRouter from "./modules/courses/courses.routes";
import postsRouter from "./modules/posts/posts.routes";
import resourcesRouter from "./modules/resources/resources.routes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors()); // TODO: configure CORS properly in production
app.use(passport.initialize());

app.use("/api-docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const swaggerDocument = yaml.parse(fs.readFileSync("./swagger.yaml", "utf8"));
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: new SwaggerTheme().getBuffer(SwaggerThemeNameEnum.DRACULA),
  })(req, res, next);
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/courses", coursessRouter);
app.use("/api/v1/courses/:courseId/posts", postsRouter);
app.use("/api/v1/courses/:courseId/resources", resourcesRouter);

export default app;
