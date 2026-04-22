import { Server, Socket, Namespace } from "socket.io";
import { verifyToken } from "../utils/verifyToken";
import { JwtPayload } from "jsonwebtoken";
import { SocketEvents } from "../types/socketEvents";

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

let io: Server;
let commentsNsp: Namespace;
let communityNsp: Namespace;

export const initSocket = (server: import("http").Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  commentsNsp = io.of("/comments");

  commentsNsp.use((socket, next) => {
    const authSocket = socket as AuthenticatedSocket;
    const token = authSocket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = verifyToken(token) as JwtPayload;
      authSocket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  commentsNsp.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;

    authSocket.on(SocketEvents.JOIN_POST, (postId: string) => {
      if (!postId) return;
      authSocket.join(`post:${postId}`);
    });

    authSocket.on(SocketEvents.LEAVE_POST, (postId: string) => {
      if (!postId) return;
      authSocket.leave(`post:${postId}`);
    });
  });

  communityNsp = io.of("/community");

  communityNsp.use((socket, next) => {
    const authSocket = socket as AuthenticatedSocket;
    const token = authSocket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = verifyToken(token) as JwtPayload;
      authSocket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  communityNsp.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const eventCounts = new Map<string, { count: number; resetAt: number }>();
    const MAX_EVENTS = 30; 
    const WINDOW_MS = 60 * 1000;

    // Helper to check rate limit
    const checkRateLimit = (eventName: string): boolean => {
      const now = Date.now();
      let eventData = eventCounts.get(eventName);

      if (!eventData || now > eventData.resetAt) {
        eventCounts.set(eventName, { count: 1, resetAt: now + WINDOW_MS });
        return true;
      }

      if (eventData.count >= MAX_EVENTS) {
        return false; // Rate limit exceeded
      }

      eventData.count++;
      return true;
    };

    authSocket.on(SocketEvents.OPEN_COMMUNITY, (courseId: string) => {
      if (!checkRateLimit(SocketEvents.OPEN_COMMUNITY)) {
        authSocket.disconnect();
        return;
      }
      if (!courseId) return;
      authSocket.join(`course:${courseId}`);
    });

    authSocket.on(SocketEvents.CLOSE_COMMUNITY, (courseId: string) => {
      if (!checkRateLimit(SocketEvents.CLOSE_COMMUNITY)) {
        authSocket.disconnect();
        return;
      }
      if (!courseId) return;
      authSocket.leave(`course:${courseId}`);
    });
  });

  console.log("Socket.io initialized");
};

export const emitToPost = (postId: string, event: string, data: unknown) => {
  if (!commentsNsp) return;
  commentsNsp.to(`post:${postId}`).emit(event, data);
};

export const emitToCommunity = (courseId: string, event: string, data: unknown) => {
  if (!communityNsp) return;
  communityNsp.to(`course:${courseId}`).emit(event, data);
};
