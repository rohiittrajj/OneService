/**
 * OneService – Socket.io Client Hook
 */
"use client";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }
  return "http://localhost:5000";
};

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    if (!socketInstance) {
      socketInstance = io(getSocketUrl(), {
        auth: { token: accessToken },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketInstance.on("connect", () => console.log("🔌 Socket connected:", socketInstance?.id));
      socketInstance.on("disconnect", (reason) => console.log("🔌 Socket disconnected:", reason));
      socketInstance.on("connect_error", (err) => console.error("Socket error:", err.message));
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect on unmount — keep persistent connection
    };
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
