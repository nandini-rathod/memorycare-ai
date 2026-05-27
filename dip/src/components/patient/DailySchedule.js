"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

const ACTIVITY_ICONS = {
  "wake": "🌅", "morning": "🌅", "breakfast": "🍳", "medicine": "💊",
  "exercise": "🚶", "walk": "🚶", "lunch": "🍽️", "rest": "😴",
  "nap": "😴", "family": "👨‍👩‍👧", "memory": "🧠", "dinner": "🌙",
  "bedtime": "🛏️", "bed": "🛏️", "water": "💧", "tea": "☕",
};

function getActivityIcon(activity) {
  const lower = activity.toLowerCase();
  for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "📌";
}

function getCurrentSlot(schedule) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let currentIdx = 0;
  for (let i = 0; i < schedule.length; i++) {
    const [h, m] = schedule[i].time.split(":").map(Number);
    const slotMinutes = h * 60 + m;
    if (slotMinutes <= currentMinutes) currentIdx = i;
  }
  return currentIdx;
}

export default function DailySchedule({ patientId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/patient/${patientId}/schedule`)
      .then((r) => setSchedule(r.data.schedule || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  const markComplete = async (idx) => {
    try {
      await api.patch(`/api/patient/${patientId}/schedule/${idx}/complete`);
      setSchedule((prev) =>
        prev.map((item, i) => i === idx ? { ...item, completed: true } : item)
      );
    } catch {}
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 animate-pulse">📅</div>
        <p className="text-xl text-gray-400">Loading your day...</p>
      </div>
    );
  }

  if (!schedule.length) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-card border border-patient-border">
        <div className="text-5xl mb-3">📅</div>
        <p className="text-2xl font-bold text-patient-text">No schedule yet</p>
        <p className="text-lg text-gray-400 mt-2">Your caregiver will set one up soon!</p>
      </div>
    );
  }

  const currentIdx = getCurrentSlot(schedule);

  return (
    <div className="space-y-3">
      {schedule.map((item, i) => {
        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;
        const isDone = item.completed;

        return (
          <div
            key={i}
            className={`rounded-2xl p-5 flex items-center gap-4 transition-all ${
              isCurrent
                ? "bg-patient-primary text-white shadow-lg border-2 border-patient-secondary"
                : isDone || isPast
                ? "bg-white/60 border border-patient-border opacity-70"
                : "bg-white border border-patient-border shadow-sm"
            }`}
          >
            {/* Icon */}
            <div className="text-3xl">{getActivityIcon(item.activity)}</div>

            {/* Content */}
            <div className="flex-1">
              <p className={`text-lg font-bold ${isCurrent ? "text-white" : "text-patient-text"}`}>
                {item.time}
              </p>
              <p className={`text-xl font-semibold ${isCurrent ? "text-white/90" : "text-patient-text"}`}>
                {item.activity}
              </p>
            </div>

            {/* Status */}
            {isCurrent && (
              <span className="bg-white/20 text-white rounded-xl px-3 py-1 text-sm font-bold">
                NOW
              </span>
            )}
            {!isDone && !isCurrent && !isPast && (
              <button
                onClick={() => markComplete(i)}
                className="bg-patient-bg rounded-xl px-3 py-2 text-patient-primary font-bold text-sm hover:bg-patient-border transition-all"
              >
                ✓ Done
              </button>
            )}
            {(isDone) && (
              <span className="text-green-500 text-2xl">✅</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
