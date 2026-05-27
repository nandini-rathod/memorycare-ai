"use client";
import { useEffect, useRef } from "react";
import api from "@/lib/api";

const REMINDER_ICONS = {
  medicine: "💊",
  meal: "🍽️",
  water: "💧",
  appointment: "🏥",
  activity: "🚶",
  other: "🔔",
};

const playGentleBeep = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(600, audioContext.currentTime); // gentle frequency
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime); // very low volume for gentle sound
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // fade out

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3); // short beep
  } catch (error) {
    // Fallback if Web Audio API not supported
    console.warn("Web Audio API not supported for beep sound");
  }
};

export default function ReminderPopup({ reminder, patientName, onDismiss, speak }) {
  const beepIntervalRef = useRef(null);

  useEffect(() => {
    // Speak the reminder aloud
    if (speak && reminder?.message) {
      speak(reminder.message);
    }

    // Start gentle beeping
    if (reminder) {
      playGentleBeep(); // Initial beep
      beepIntervalRef.current = setInterval(() => {
        playGentleBeep();
      }, 3000); // Beep every 3 seconds
    }

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [reminder, speak]);

  const handleDismiss = async () => {
    // Stop beeping
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }

    if (reminder?.id) {
      await api.post(`/api/patient/${reminder.patientId}/reminder-ack`, {
        reminderId: reminder.id,
      }).catch(() => {});
    }
    onDismiss();
  };

  if (!reminder) return null;

  const icon = REMINDER_ICONS[reminder.type] || "🔔";

  return (
    <div className="reminder-overlay fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl animate-slide-up border-4 border-patient-accent">
        {/* Icon */}
        <div className="text-8xl mb-4">{icon}</div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-patient-text mb-4">
          Reminder for you, {patientName}!
        </h2>

        {/* Message */}
        <div className="bg-patient-bg rounded-2xl p-6 mb-8">
          <p className="text-2xl font-semibold text-patient-primary leading-relaxed">
            {reminder.message}
          </p>
        </div>

        {/* Time */}
        <p className="text-gray-400 text-lg mb-6">
          {new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="bg-patient-primary text-white rounded-3xl px-12 py-5 text-2xl font-bold shadow-lg hover:bg-patient-secondary transition-all active:scale-95 w-full"
          style={{ minHeight: "80px" }}
        >
          ✓ OK, I understand
        </button>
      </div>
    </div>
  );
}
