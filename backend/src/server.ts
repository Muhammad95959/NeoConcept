import app from "./app";

const port = Number(process.env.PORT) || 9595;

app.listen(port, "0.0.0.0", () => console.log("Server is running on http://localhost:" + port));
