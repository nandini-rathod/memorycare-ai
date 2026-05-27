"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "Nunito, sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            borderRadius: "12px",
          },
        }}
      />
    </SessionProvider>
  );
}
