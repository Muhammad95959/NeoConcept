import express from "express";
import passport from "passport";
import authRouter from "./routes/authRoutes";
import "./config/passport";

const app = express();
const port = process.env.PORT || 9595;

app.use(express.json());
app.use(passport.initialize());
app.use("/api/v1/auth", authRouter);

app.listen(port, () => console.log("Server is running on http://localhost:" + port));
