import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }
  return socket;
}

export function joinAuction(auctionId: number) {
  const s = getSocket();
  s.emit("join_auction", auctionId);
}

export function leaveAuction(auctionId: number) {
  const s = getSocket();
  s.emit("leave_auction", auctionId);
}
