import { Server as SocketServer } from "socket.io";
import { Server } from "http";

let io: SocketServer;

export function setupSocket(httpServer: Server) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("join_auction", (auctionId: number) => {
      socket.join(`auction:${auctionId}`);
      console.log(`${socket.id} joined auction:${auctionId}`);
    });

    socket.on("leave_auction", (auctionId: number) => {
      socket.leave(`auction:${auctionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
