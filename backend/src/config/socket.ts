import { Server, Socket, Namespace } from "socket.io";
import { verifyToken } from "../utils/verifyToken";
import { JwtPayload } from "jsonwebtoken";
import { SocketEvents } from "../types/socketEvents";

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

let io: Server;
let commentsNsp: Namespace;

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

  console.log("Socket.io initialized");
};

export const getCommentsNamespace = () => commentsNsp;

export const emitToPost = (postId: string, event: string, data: unknown) => {
  if (!commentsNsp) return;
  commentsNsp.to(`post:${postId}`).emit(event, data);
};
