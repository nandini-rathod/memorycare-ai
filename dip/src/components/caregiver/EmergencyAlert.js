"use client";
import { useEffect, useRef } from "react";

const playStrongBeep = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime); // higher frequency for urgency
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // louder volume
    gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.5); // fade out

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5); // longer beep
  } catch (error) {
    console.warn("Web Audio API not supported for beep sound");
  }
};

export default function EmergencyAlert({ alert, onDismiss }) {
  const beepIntervalRef = useRef(null);

  useEffect(() => {
    if (alert) {
      // Play strong beep immediately and repeat every 2 seconds
      playStrongBeep();
      beepIntervalRef.current = setInterval(() => {
        playStrongBeep();
      }, 2000); // Beep every 2 seconds
    }

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [alert]);

  const handleDismiss = () => {
    // Stop beeping
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    onDismiss();
  };

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-900/95 flex items-center justify-center p-6 animate-pulse">
      <div className="bg-red-50 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl border-4 border-red-600">
        {/* Emergency Icon */}
        <div className="text-8xl mb-4 animate-bounce">🚨</div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-red-800 mb-4">
          EMERGENCY ALERT!
        </h2>

        {/* Message */}
        <div className="bg-red-100 rounded-2xl p-6 mb-8 border-2 border-red-300">
          <p className="text-3xl font-bold text-red-900 leading-relaxed">
            {alert.patientName} pressed the HELP button!
          </p>
          <p className="text-lg text-red-700 mt-2">
            Immediate attention required
          </p>
        </div>

        {/* Time */}
        <p className="text-red-600 text-lg mb-6 font-semibold">
          {new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="bg-red-600 text-white rounded-3xl px-12 py-5 text-2xl font-bold shadow-lg hover:bg-red-700 transition-all active:scale-95 w-full"
          style={{ minHeight: "80px" }}
        >
          ✓ Acknowledge Alert
        </button>
      </div>
    </div>
  );
}