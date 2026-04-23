import express from "express";
import request from "supertest";
import { requestLogger } from "../requestLogger";
import { logger } from "../../utils/logger";

jest.mock("../../utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("requestLogger middleware", () => {
  const loggerMock = logger as jest.Mocked<typeof logger>;

  const createApp = () => {
    const app = express();

    app.use(requestLogger);
    app.get("/ok", (_req, res) => res.status(200).json({ ok: true }));
    app.get("/redirect", (_req, res) => res.status(302).json({ redirected: true }));
    app.get("/bad", (_req, res) => res.status(400).json({ bad: true }));
    app.get("/err", (_req, res) => res.status(500).json({ err: true }));
    app.get("/users/:id", (req, res) => res.status(200).json({ id: req.params.id, q: req.query.q }));
    app.get("/api-docs", (_req, res) => res.status(200).send("docs"));

    return app;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs info for successful requests", async () => {
    const app = createApp();

    await request(app).get("/ok").set("User-Agent", "jest-agent").expect(200);

    expect(loggerMock.info).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining("GET /ok [200]"));
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining("ip="));
  });

  it("logs debug for 3xx responses", async () => {
    const app = createApp();

    await request(app).get("/redirect").expect(302);

    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith(expect.stringContaining("GET /redirect [302]"));
  });

  it("logs warn for 4xx responses", async () => {
    const app = createApp();

    await request(app).get("/bad").expect(400);

    expect(loggerMock.warn).toHaveBeenCalledTimes(1);
    expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining("GET /bad [400]"));
  });

  it("logs error for 5xx responses", async () => {
    const app = createApp();

    await request(app).get("/err").expect(500);

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining("GET /err [500]"));
  });

  it("includes params and query when present", async () => {
    const app = createApp();

    await request(app).get("/users/42?q=test").expect(200);

    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('params={"id":"42"}'));
    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('query={"q":"test"}'));
  });

  it("skips logging for /api-docs route", async () => {
    const app = createApp();

    await request(app).get("/api-docs").expect(200);

    expect(loggerMock.info).not.toHaveBeenCalled();
    expect(loggerMock.warn).not.toHaveBeenCalled();
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });
});
