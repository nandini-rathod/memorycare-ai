"use client";
import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function HelpButton({ patientId, patientName, speak }) {
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleHelp = async () => {
    if (loading || pressed) return;
    setLoading(true);

    try {
      await api.post(`/api/patient/${patientId}/emergency`);
      setPressed(true);
      const msg = "I am here with you. You are safe. Your caregiver has been notified and will contact you soon.";
      speak(msg);
      toast.success("Your caregiver has been notified! 💙", { duration: 8000 });
      setTimeout(() => setPressed(false), 30000);
    } catch {
      speak("I'm here with you. You are safe.");
      toast("I'm here with you. You are safe.", { icon: "💙", duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-6">
      <button
        onClick={handleHelp}
        disabled={loading}
        className={`rounded-3xl px-10 py-5 text-2xl font-bold shadow-2xl transition-all active:scale-95 w-full max-w-md ${
          pressed
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
        style={{ minHeight: "80px" }}
      >
        {pressed ? "✓ Help is coming! 💙" : "🆘 I Need Help"}
      </button>
    </div>
  );
}
