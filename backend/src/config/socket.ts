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

  commentsNsp.use(async (socket, next) => {
    const authSocket = socket as AuthenticatedSocket;
    const token = authSocket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = await verifyToken(token) as JwtPayload;
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

  communityNsp.use(async (socket, next) => {
    const authSocket = socket as AuthenticatedSocket;
    const token = authSocket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = await verifyToken(token) as JwtPayload;
      authSocket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  communityNsp.on("connection", (socket) => {
    console.log("User connected to community namespace");
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
        console.log(`Rate limit exceeded for event ${eventName}`);
        return false; // Rate limit exceeded
      }

      eventData.count++;
      return true;
    };

    // Get active users in a course
    const getActiveUsersInCourse = (courseId: string) => {
      const sockets = Array.from(communityNsp.sockets.values());
      return sockets
        .filter((s) => (s as AuthenticatedSocket).rooms.has(`course:${courseId}`) && (s as AuthenticatedSocket).user)
        .map((s) => {
          const authSock = s as AuthenticatedSocket;
          return {
            id: authSock.user?.id,
            name: authSock.user?.username || "Unknown",
          };
        });
    };

    authSocket.on(SocketEvents.OPEN_COMMUNITY, (courseId: string) => {
      if (!checkRateLimit(SocketEvents.OPEN_COMMUNITY)) {
        authSocket.disconnect();
        return;
      }
      if (!courseId) return;
      authSocket.join(`course:${courseId}`);
      
      emitToCommunity(courseId, SocketEvents.USER_JOINED, {
        userId: authSocket.user?.id,
        userName: authSocket.user?.username || "Unknown",
        timestamp: new Date(),
      });

      authSocket.emit(SocketEvents.ACTIVE_USERS, getActiveUsersInCourse(courseId));
    });

    authSocket.on(SocketEvents.CLOSE_COMMUNITY, (courseId: string) => {
      if (!checkRateLimit(SocketEvents.CLOSE_COMMUNITY)) {
        authSocket.disconnect();
        return;
      }
      if (!courseId) return;
      authSocket.leave(`course:${courseId}`);

      // Broadcast that a user left
      emitToCommunity(courseId, SocketEvents.USER_LEFT, {
        userId: authSocket.user?.id,
      });
    });

    // On-demand request for active users list
    authSocket.on(SocketEvents.GET_ACTIVE_USERS, (courseId: string) => {
      if (!checkRateLimit(SocketEvents.GET_ACTIVE_USERS)) {
        authSocket.disconnect();
        return;
      }
      if (!courseId) return;

      const activeUsers = getActiveUsersInCourse(courseId);
      authSocket.emit(SocketEvents.ACTIVE_USERS, activeUsers);
    });

    // Typing indicator
    authSocket.on(SocketEvents.USER_TYPING,async (courseId: string, isTyping: boolean) => {
      console.log(`User ${authSocket.user?.username} is ${isTyping ? "typing..." : "not typing"}`);
      if (!checkRateLimit(SocketEvents.USER_TYPING)) {
        authSocket.disconnect();
        return;
      }
      if (!courseId) return;
      const userName = authSocket.user?.username || "Unknown";
      emitToCommunity(courseId, SocketEvents.USER_TYPING, {
        userId: authSocket.user?.id,
        userName: authSocket.user?.username || "Unknown",
        isTyping,
      });
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
