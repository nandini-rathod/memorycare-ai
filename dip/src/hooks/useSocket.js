"use client";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

export function useSocket(patientId, role = "patient", caregiverId = null) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (role === "patient") {
        socket.emit("join_patient", patientId);
      } else {
        socket.emit("join_caregiver", { caregiverId, patientIds: [patientId] });
      }
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [patientId, role, caregiverId]);

  return { socket: socketRef.current, connected };
}

export function useCaregiverSocket(patientIds, caregiverId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!patientIds?.length) return;

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_caregiver", { caregiverId, patientIds });
    });

    socket.on("disconnect", () => setConnected(false));

    return () => socket.disconnect();
  }, [JSON.stringify(patientIds), caregiverId]);

  return { socket: socketRef.current, connected };
}
