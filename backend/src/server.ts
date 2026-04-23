import tracer from "dd-trace";

// Initializing the Datadog tracer to enable distributed tracing for the application.
tracer.init({
  service: "neoconcept-backend",
  env: "development",
});

import app from "./app";
import { initSocket } from "./config/socket";

const port = Number(process.env.PORT) || 9595;

const server = app.listen(port, "0.0.0.0", () => {
  console.log("Server is running on http://localhost:" + port);
});

initSocket(server);