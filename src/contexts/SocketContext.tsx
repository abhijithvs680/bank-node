import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import axios from "axios";

interface SocketContextType {
  socket: Socket | null;
  externalSocket: Socket | null;
  connected: boolean;
  emit: (eventName: string, payload: any) => void;
  addListener: (eventName: string, callback: (data: any) => void) => void;
  removeListener: (eventName: string, callback: (data: any) => void) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

const STATIC_JOHN_DOE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoiSm9obiIsImxhc3RfbmFtZSI6IkRvZSIsImVtYWlsIjoiam9obkBkb2UuY29tIn0.VecL2MImatj3_4y7I-y0sCoIOd3WPn86Z6ltQQ8fPwg";

const STATIC_PLATFORM_USER = {
  fname: "Abhijith ",
  uid: "1472",
  email: "abhijith@vizru.com",
  exp: 1784973524,
  domain: "innov-dev.beta.injomo.com",
  persistant: "1"
};
const STATIC_PLATFORM_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(STATIC_PLATFORM_USER))}.mock_signature`;


export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryConnected, setPrimaryConnected] = useState(false);
  const [externalConnected, setExternalConnected] = useState(false);

  const primarySocketRef = useRef<Socket | null>(null);
  const externalSocketRef = useRef<Socket | null>(null);

  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  
  const { isAuthenticated, user } = useAuth();

  const addListener = (eventName: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(eventName)) {
      listenersRef.current.set(eventName, new Set());
    }
    listenersRef.current.get(eventName)!.add(callback);

    if (primarySocketRef.current) {
      primarySocketRef.current.on(eventName, callback);
    }
    if (externalSocketRef.current) {
      externalSocketRef.current.on(eventName, callback);
    }
  };

  const removeListener = (eventName: string, callback: (data: any) => void) => {
    const set = listenersRef.current.get(eventName);
    if (set) {
      set.delete(callback);
    }
    if (primarySocketRef.current) {
      primarySocketRef.current.off(eventName, callback);
    }
    if (externalSocketRef.current) {
      externalSocketRef.current.off(eventName, callback);
    }
  };

  const emit = (eventName: string, payload: any) => {
    let emitted = false;
    if (primarySocketRef.current?.connected) {
      primarySocketRef.current.emit(eventName, payload);
      emitted = true;
    }
    if (externalSocketRef.current?.connected) {
      externalSocketRef.current.emit(eventName, payload);
      emitted = true;
    }
    if (!emitted) {
      console.warn("No active socket connection. Event not emitted:", eventName);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect both sockets
      if (primarySocketRef.current) {
        console.log("[SocketContext] Disconnecting primary socket");
        primarySocketRef.current.disconnect();
        primarySocketRef.current = null;
      }
      if (externalSocketRef.current) {
        console.log("[SocketContext] Disconnecting external socket");
        externalSocketRef.current.disconnect();
        externalSocketRef.current = null;
      }
      setPrimaryConnected(false);
      setExternalConnected(false);
      return;
    }

    const connectSockets = async () => {
      let externalToken = localStorage.getItem("externalToken") || "";
      const jwt = localStorage.getItem("jwtToken") || "";

      if (!externalToken && jwt) {
        try {
          // Attempt to fetch the platform user token using JWT
          const res = await axios.get("https://innov-dev.beta.injomo.com/workflow.trigger/getusertoken6a6742a801e15", {
            headers: {
              Authorization: `Bearer ${jwt}`
            }
          });
          const tokenData = res.data?.token || res.data?.result || res.data;
          if (typeof tokenData === 'object' && tokenData?.token) {
              externalToken = tokenData.token;
          } else if (typeof tokenData === 'string') {
              externalToken = tokenData;
          }
          
          if (externalToken && typeof externalToken === 'string') {
              localStorage.setItem("externalToken", externalToken);
          }
        } catch(err) {
          console.error("Failed to fetch external user token", err);
        }
      }

      const tenantId = localStorage.getItem("tenantId") || "204";
      const externalSocketServer = localStorage.getItem("externalSocketServer") || "";

      const username = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email;
      const userId = user.id?.toString() || "";
      const email = user.email || "";

      const lid = localStorage.getItem("user_details_Location_GDID") ||
                  localStorage.getItem("user_details_LocationID") ||
                  "1120";

      const initSocketSession = (socket: Socket) => {
        // 1. Emit vizru_user authentication event
        socket.emit("vizru_user", {
          username: "Abhijith", // use static user's name
          email: STATIC_PLATFORM_USER.email,
          id: STATIC_PLATFORM_USER.uid,
          auth_token: STATIC_PLATFORM_TOKEN,
          tid: tenantId,
        });

        // 2. Emit ls_switch event
        socket.emit("ls_switch", {
          lid,
          tid: tenantId,
        });
      };

      // ==========================================
      // 1. CONNECT PRIMARY CHAT SOCKET (chatv2)
      // ==========================================
      const primaryUrl = "https://chatv2.beta.injomo.com:8443";
      console.log("[SocketContext] Connecting primary socket to:", primaryUrl);

      const primarySocket = io(primaryUrl, {
        query: {
          authorization: STATIC_PLATFORM_TOKEN,
          tenent_id: tenantId,
          EIO: "3",
          transport: "websocket",
        },
        transports: ["websocket"],
        secure: true,
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 2000,
        timeout: 300000,
      });

      primarySocketRef.current = primarySocket;

      primarySocket.on("connect", () => {
        console.log("[SocketContext] Primary socket connected:", primarySocket.id);
        setPrimaryConnected(true);
        initSocketSession(primarySocket);
      });

      primarySocket.on("disconnect", (reason: string) => {
        console.log("[SocketContext] Primary socket disconnected:", reason);
        setPrimaryConnected(false);
      });

      primarySocket.on("connect_error", (error: any) => {
        console.error("[SocketContext] Primary socket connection error:", error);
        setPrimaryConnected(false);
      });

      // ==========================================
      // 2. CONNECT EXTERNAL SOCKET (chat)
      // ==========================================
      if (externalSocketServer) {
        console.log("[SocketContext] Connecting external socket to:", externalSocketServer);

        const externalSocket = io(externalSocketServer, {
          query: {
            token: STATIC_JOHN_DOE_TOKEN,
            EIO: "3",
            transport: "websocket",
          },
          transports: ["websocket"],
          secure: true,
          reconnection: true,
          reconnectionAttempts: 20,
          reconnectionDelay: 2000,
          timeout: 300000,
        });

        externalSocketRef.current = externalSocket;

        externalSocket.on("connect", () => {
          console.log("[SocketContext] External socket connected:", externalSocket.id);
          setExternalConnected(true);
          initSocketSession(externalSocket);
        });

        externalSocket.on("disconnect", (reason: string) => {
          console.log("[SocketContext] External socket disconnected:", reason);
          setExternalConnected(false);
        });

        externalSocket.on("connect_error", (error: any) => {
          console.error("[SocketContext] External socket connection error:", error);
          setExternalConnected(false);
        });
      }

      // Register all active context listeners to both new sockets
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach((cb) => {
          primarySocket.on(event, cb);
          if (externalSocketRef.current) {
            externalSocketRef.current.on(event, cb);
          }
        });
      });
    };

    connectSockets();

    return () => {
      console.log("[SocketContext] Cleaning up both socket connections");
      if (primarySocketRef.current) {
        primarySocketRef.current.disconnect();
        primarySocketRef.current = null;
      }
      if (externalSocketRef.current) {
        externalSocketRef.current.disconnect();
        externalSocketRef.current = null;
      }
      setPrimaryConnected(false);
      setExternalConnected(false);
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider
      value={{
        socket: primarySocketRef.current,
        externalSocket: externalSocketRef.current,
        connected: primaryConnected || externalConnected,
        emit,
        addListener,
        removeListener,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
