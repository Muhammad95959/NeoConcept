import express from "express";
import cors from "cors";
import passport from "passport";
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

app.listen(port, () => console.log("Server is running on http://localhost:" + port));
