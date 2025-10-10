import express from "express";
import cors from "cors";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import YAML from "yamljs";
import path from "path";
import authRouter from "./routes/authRoutes";
import subjectsRouter from "./routes/subjectsRoutes";
import postsRouter from "./routes/postsRoutes";
import resourcesRouter from "./routes/resourcesRoutes";
import "./config/passport";

const app = express();
const port = process.env.PORT || 9595;

app.use(express.json());
app.use(cors()); // TODO: configure CORS properly in production
app.use(passport.initialize());

const swaggerDocument = YAML.load(path.resolve(__dirname, "../swagger.yaml"));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customCss: new SwaggerTheme().getBuffer(SwaggerThemeNameEnum.DRACULA),
  }),
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/subjects", subjectsRouter);
app.use("/api/v1/subjects/:subjectId/posts", postsRouter);
app.use("/api/v1/subjects/:subjectId/resources", resourcesRouter);

app.listen(port, () => console.log("Server is running on http://localhost:" + port));
