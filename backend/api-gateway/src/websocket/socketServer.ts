import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { publishToRoom, subscribeToAllDesignEvents } from "@sysflow/shared";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    },
  });

    // Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as { userId: string; email: string };

      socket.userId = decoded.userId;
      socket.email = decoded.email;
      next();
    } catch {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  
    // REDIS → SOCKET.IO (SUBSCRIBE ONCE PER SERVER)

  subscribeToAllDesignEvents((channel, event) => {
    const designId = channel.replace("design_", "");
    io.to(designId).emit(event.type.toLowerCase(), event);
  });


    // Socket Connections
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId} (${socket.email})`);

    /* -------- JOIN ROOM -------- */
    socket.on("join_room", async (designId: string) => {
      console.log(`User ${socket.userId} joining room: ${designId}`);
      await socket.join(designId);
      socket.emit("room_joined", { designId });
    });

    /* -------- LEAVE ROOM -------- */
    socket.on("leave_room", async (designId: string) => {
      console.log(`User ${socket.userId} leaving room: ${designId}`);
      await socket.leave(designId);
      socket.emit("room_left", { designId });
    });

    /* -------- NODE UPDATED -------- */
    socket.on("node_updated", async (data: any) => {
      const { designId, nodeId, updates } = data;

      const event = {
        type: "NODE_UPDATED",
        payload: { nodeId, updates },
        userId: socket.userId,
        timestamp: Date.now(),
      };

      await publishToRoom(designId, JSON.stringify(event));
    });

    /* -------- NODE ADDED -------- */
    socket.on("node_added", async (data: any) => {
      const { designId, node } = data;

      const event = {
        type: "NODE_ADDED",
        payload: { node },
        userId: socket.userId,
        timestamp: Date.now(),
      };

      await publishToRoom(designId, JSON.stringify(event));
    });

    /* -------- EDGE ADDED -------- */
    socket.on("edge_added", async (data: any) => {
      const { designId, edge } = data;

      const event = {
        type: "EDGE_ADDED",
        payload: { edge },
        userId: socket.userId,
        timestamp: Date.now(),
      };

      await publishToRoom(designId, JSON.stringify(event));
    });

    /* -------- EDGE DELETED -------- */
    socket.on("edge_deleted", async (data: any) => {
      const { designId, edgeId } = data;

      const event = {
        type: "EDGE_DELETED",
        payload: { edgeId },
        userId: socket.userId,
        timestamp: Date.now(),
      };

      await publishToRoom(designId, JSON.stringify(event));
    });

    /* -------- NODE DELETED -------- */
    socket.on("node_deleted", async (data: any) => {
      const { designId, nodeId } = data;

      const event = {
        type: "NODE_DELETED",
        payload: { nodeId },
        userId: socket.userId,
        timestamp: Date.now(),
      };

      await publishToRoom(designId, JSON.stringify(event));
    });

    /* -------- DISCONNECT -------- */
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId} (${socket.email})`);
    });
  });

  return io;
}
