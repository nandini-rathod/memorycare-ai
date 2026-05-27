"use client";
import { useEffect } from "react";

export default function CaregiverMessage({ message, onDismiss, speak }) {
  useEffect(() => {
    if (speak && message?.message) {
      speak(`Message from ${message.from}: ${message.message}`);
    }
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 reminder-overlay">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border-4 border-care-primary animate-slide-up">
        <div className="text-6xl mb-4">💌</div>
        <h2 className="text-2xl font-bold text-care-primary mb-2">
          Message from {message.from}
        </h2>
        <div className="bg-care-bg rounded-2xl p-6 mb-6">
          <p className="text-2xl font-semibold text-care-text leading-relaxed">
            {message.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="bg-care-primary text-white rounded-2xl px-10 py-4 text-xl font-bold w-full"
          style={{ minHeight: "72px" }}
        >
          ✓ Got it, thank you!
        </button>
      </div>
    </div>
  );
}
