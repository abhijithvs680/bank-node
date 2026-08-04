import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

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

/** chatsystem-v2 authorization token (System User / tenant 11) */
const STATIC_CHATSYSTEM_AUTH_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmbmFtZSI6IlN5c3RlbSBVc2VyIiwidWlkIjoiMTg4IiwiZW1haWwiOiJzeXN0ZW11c2VyQHZpenJ1LmNvbSIsImV4cCI6MTc4NTk0NTExNywiZG9tYWluIjoiYWktZGVtby52aXpydS1yYXMuY29tIiwicGVyc2lzdGFudCI6IjAifQ.n0_G9OrWCNoHuHeOjILr2c1UgYnUSrbJMfDQw1nTWiA";

const EXTERNAL_SOCKET_URL = "https://ai-demo.vizru-ras.com";
const PRIMARY_SOCKET_URL = "https://ai-demo.vizru-ras.com";
const PRIMARY_SOCKET_PATH = "/chatsystem-v2/socket.io";

const STATIC_PLATFORM_USER = {
  fname: "System User",
  uid: "188",
  email: "systemuser@vizru.com",
  exp: 1785945117,
  domain: "ai-demo.vizru-ras.com",
  persistant: "0",
};

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
    if (!isAuthenticated) {
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

    let isMounted = true;

    const connectSockets = async () => {
      const chatAuthToken = STATIC_CHATSYSTEM_AUTH_TOKEN;
      localStorage.setItem("externalToken", chatAuthToken);

      if (!isMounted) return;

      const tenantId = "11";
      localStorage.setItem("tenantId", tenantId);
      localStorage.setItem("externalSocketServer", EXTERNAL_SOCKET_URL);

      // Username/id/email must match the chatsystem authorization token payload
      const username = STATIC_PLATFORM_USER.fname;
      const userId = STATIC_PLATFORM_USER.uid;
      const email = STATIC_PLATFORM_USER.email;

      const lid = localStorage.getItem("user_details_Location_GDID") ||
                  localStorage.getItem("user_details_LocationGDID") ||
                  localStorage.getItem("user_details_location_gdid") ||
                  localStorage.getItem("user_details_LocationID") ||
                  localStorage.getItem("user_details_LocationId") ||
                  localStorage.getItem("user_details_location_id") ||
                  localStorage.getItem("user_details_locationId") ||
                  localStorage.getItem("user_details_lid") ||
                  localStorage.getItem("user_details_Location") ||
                  localStorage.getItem("user_details_location") ||
                  localStorage.getItem("user_details_Network_GDID") ||
                  localStorage.getItem("user_details_Organization_GDID") ||
                  "1120";

      const initSocketSession = (socket: Socket) => {
        // 1. Emit vizru_user authentication event
        socket.emit("vizru_user", {
          username,
          email,
          id: userId,
          auth_token: chatAuthToken,
          tid: tenantId,
        });

        // 2. Emit ls_switch event
        socket.emit("ls_switch", {
          lid,
          tid: tenantId,
        });
      };

      // ==========================================
      // 1. CONNECT PRIMARY CHAT SOCKET (chatsystem-v2)
      // wss://ai-demo.vizru-ras.com/chatsystem-v2/socket.io/?authorization=...&tenent_id=11
      // ==========================================
      console.log("[SocketContext] Connecting primary socket to:", PRIMARY_SOCKET_URL, PRIMARY_SOCKET_PATH);

      const primarySocket = io(PRIMARY_SOCKET_URL, {
        path: PRIMARY_SOCKET_PATH,
        query: {
          authorization: chatAuthToken,
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
      // 2. CONNECT EXTERNAL SOCKET
      // wss://ai-demo.vizru-ras.com/socket.io/?token=...
      // ==========================================
      console.log("[SocketContext] Connecting external socket to:", EXTERNAL_SOCKET_URL);

      const externalSocket = io(EXTERNAL_SOCKET_URL, {
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
      isMounted = false;
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
