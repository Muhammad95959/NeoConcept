import express from "express";
import cors from "cors";
import passport from "passport";
import swaggerjsdoc from "swagger-jsdoc";
import swaggerui from "swagger-ui-express";
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
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/subjects", subjectsRouter);
app.use("/api/v1/subjects/:subjectId/posts", postsRouter);
app.use("/api/v1/subjects/:subjectId/resources", resourcesRouter);

const specs = swaggerjsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "NeoConcept API", version: "0.0.1" },
    servers: [{ url: `http://localhost:${port}/api/v1` }],
  },
  apis: ["./src/routes/*.ts"],
});
app.use("/api-docs", swaggerui.serve, swaggerui.setup(specs, { explorer: true }));

app.listen(port, () => console.log("Server is running on http://localhost:" + port));
