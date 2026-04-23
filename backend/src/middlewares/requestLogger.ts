import morgan from "morgan";
import { logger } from "../utils/logger";
import { Request } from "express";

const MAX_SERIALIZED_LENGTH = 200;

// This function determines the log level based on the HTTP status code of the response.
const getLogLevel = (status: number): "error" | "warn" | "info" | "debug" => {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  if (status >= 300) return "debug";
  return "info";
};

// This function serializes an object to a JSON string, truncating it if it exceeds a certain length to prevent excessively long log messages.
const serializeObject = (value: Record<string, unknown>): string => {
  const serialized = JSON.stringify(value);

  if (serialized.length <= MAX_SERIALIZED_LENGTH) {
    return serialized;
  }

  return `${serialized.slice(0, MAX_SERIALIZED_LENGTH)}...`;
};

// This function formats the log message to include method, URL, status, timing, and request metadata.
const formatLogMessage = (
  method: string,
  url: string,
  status: number,
  responseTime: number,
  ip: string,
  userAgent: string,
  requestId: string,
  contentLength?: string,
  params?: Record<string, unknown>,
  query?: Record<string, unknown>,
): string => {
  const contentLengthStr = contentLength ? ` | size=${contentLength}` : "";
  const paramsStr = params && Object.keys(params).length ? ` | params=${serializeObject(params)}` : "";
  const queryStr = query && Object.keys(query).length ? ` | query=${serializeObject(query)}` : "";
  const userAgentStr = userAgent ? ` | ua=${userAgent}` : "";
  const requestIdStr = requestId ? ` | requestId=${requestId}` : "";

  return `${method} ${url} [${status}] - ${responseTime.toFixed(1)}ms | ip=${ip}${contentLengthStr}${paramsStr}${queryStr}${userAgentStr}${requestIdStr}`;
};

// Create a morgan middleware that uses the custom format function and log level based on status code.
export const requestLogger = morgan(
  (tokens, req, res) => {
    // Extract relevant information from the request and response using morgan tokens.
    const expressReq = req as Request;
    const method = tokens.method?.(req, res) || "UNKNOWN";
    const url = tokens.url?.(req, res) || "/";
    const status = tokens.status?.(req, res) || String(res.statusCode || 200);
    const contentLength = tokens.res?.(req, res, "content-length");
    const responseTime = parseFloat(tokens["response-time"]?.(req, res) || "0");
    const params = expressReq.params as Record<string, unknown>;
    const query = expressReq.query as Record<string, unknown>;
    const ip = tokens["remote-addr"]?.(req, res) || expressReq.socket.remoteAddress || "unknown";
    const userAgent = tokens["user-agent"]?.(req, res) || "";
    const requestId = expressReq.get("x-request-id") || "";

    const statusCode = Number.parseInt(status, 10) || res.statusCode || 500;
    const logLevel = getLogLevel(statusCode);

    const message = formatLogMessage(
      method,
      url,
      statusCode,
      responseTime,
      ip,
      userAgent,
      requestId,
      contentLength,
      params,
      query,
    );

    logger[logLevel](message);

    return null;
  },
  {
    skip: (req) => req.url?.startsWith("/api-docs") ?? false,
  },
);
