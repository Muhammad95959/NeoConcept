import express from "express";
import authRouter from "./routes/authRoutes";

const app = express();
const port = process.env.PORT || 9595;

app.use(express.json());

app.listen(port, () => console.log("Server is running on http://localhost:" + port));
