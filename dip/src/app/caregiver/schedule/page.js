"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCaregiverSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import EmergencyAlert from "@/components/caregiver/EmergencyAlert";

const ACTIVITY_SUGGESTIONS = [
  "Wake up and morning routine", "Breakfast", "Morning medicine",
  "Light exercise or walk", "Lunch", "Rest / nap time",
  "Family photos and memory activity", "Dinner", "Evening medicine", "Bedtime routine",
];

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/caregiver/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const token = session?.accessToken;
    if (token) localStorage.setItem("caregiverToken", token);
    api.get("/api/caregiver/patients").then((r) => {
      setPatients(r.data);
      if (r.data[0]) {
        setSelectedPatient(r.data[0]._id);
        setSchedule(r.data[0].dailySchedule || []);
      }
    }).finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!selectedPatient) return;
    const p = patients.find((x) => x._id === selectedPatient);
    if (p) setSchedule(p.dailySchedule || []);
  }, [selectedPatient]);

  const addSlot = () => {
    setSchedule((prev) => [...prev, { time: "12:00", activity: "" }]);
  };

  const updateSlot = (idx, field, value) => {
    setSchedule((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeSlot = (idx) => {
    setSchedule((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveSchedule = async () => {
    const sorted = [...schedule].sort((a, b) => a.time.localeCompare(b.time));
    setSaving(true);
    try {
      await api.put(`/api/caregiver/patients/${selectedPatient}/schedule`, { schedule: sorted });
      setSchedule(sorted);
      toast.success("Schedule saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="pt-16 md:pt-0 flex items-center justify-center h-96">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📅</div><p className="text-care-muted">Loading...</p></div>
    </div>
  );

  return (
    <div className="pt-16 md:pt-0 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-care-text">Daily Schedule</h1>
          <p className="text-care-muted mt-1">Set the patient's daily routine</p>
        </div>
        <button onClick={saveSchedule} disabled={saving}
          className="bg-care-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-care-secondary transition-all disabled:opacity-50">
          {saving ? "Saving..." : "💾 Save"}
        </button>
      </div>

      {patients.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {patients.map((p) => (
            <button key={p._id} onClick={() => setSelectedPatient(p._id)}
              className={`rounded-xl px-4 py-2 font-bold text-sm transition-all ${selectedPatient === p._id ? "bg-care-primary text-white" : "bg-white border border-care-border text-care-muted"}`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 mb-4">
        {schedule.map((slot, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 border border-care-border shadow-sm flex items-center gap-3">
            <input
              type="time"
              value={slot.time}
              onChange={(e) => updateSlot(idx, "time", e.target.value)}
              className="border-2 border-care-border rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-care-primary w-28"
            />
            <input
              value={slot.activity}
              onChange={(e) => updateSlot(idx, "activity", e.target.value)}
              placeholder="Activity description"
              list={`suggestions-${idx}`}
              className="flex-1 border-2 border-care-border rounded-xl px-4 py-2 text-sm outline-none focus:border-care-primary"
            />
            <datalist id={`suggestions-${idx}`}>
              {ACTIVITY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
            <button onClick={() => removeSlot(idx)} className="text-red-400 hover:text-red-600 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-all text-xl">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button onClick={addSlot} className="w-full border-2 border-dashed border-care-border rounded-2xl py-4 text-care-primary font-bold hover:border-care-primary hover:bg-blue-50 transition-all">
        + Add Time Slot
      </button>

      {schedule.length === 0 && (
        <div className="text-center mt-6 text-care-muted">
          <p>No schedule items. Add time slots to build the daily routine.</p>
        </div>
      )}
    </div>
  );
}
