"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useCaregiverSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import EmergencyAlert from "@/components/caregiver/EmergencyAlert";

const REMINDER_TYPES = ["medicine", "meal", "water", "appointment", "activity", "other"];
const REMINDER_ICONS = {
  medicine: "💊", meal: "🍽️", water: "💧", appointment: "🏥", activity: "🚶", other: "🔔",
};
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function ReminderModal({ reminder, patientId, onClose, onSave }) {
  const isEdit = !!reminder?._id;
  const [form, setForm] = useState(
    reminder || { time: "08:00", message: "", type: "medicine", days: [...DAYS] }
  );
  const [loading, setLoading] = useState(false);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleSave = async () => {
    if (!form.message) return toast.error("Message is required");
    if (!form.days.length) return toast.error("Select at least one day");
    setLoading(true);
    try {
      const res = isEdit
        ? await api.put(`/api/caregiver/reminders/${reminder._id}`, form)
        : await api.post(`/api/caregiver/patients/${patientId}/reminders`, form);
      onSave(res.data);
      toast.success(isEdit ? "Reminder updated!" : "Reminder added!");
      onClose();
    } catch {
      toast.error("Failed to save reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-care-text mb-6">
          {isEdit ? "Edit Reminder" : "Add Reminder"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Time *</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {REMINDER_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`rounded-xl py-2.5 text-sm font-bold capitalize transition-all ${
                    form.type === t
                      ? "bg-care-primary text-white"
                      : "bg-care-bg text-care-muted hover:text-care-text"
                  }`}
                >
                  {REMINDER_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Message *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="e.g. Time to take your morning medicine"
              rows={3}
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-2">Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    form.days.includes(d)
                      ? "bg-care-primary text-white"
                      : "bg-care-bg text-care-muted hover:text-care-text"
                  }`}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border-2 border-care-border rounded-xl py-3 font-bold text-care-muted">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-care-primary text-white rounded-xl py-3 font-bold disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RemindersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [reminders, setReminders] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState(null);

  // Socket for emergency alerts
  const patientIds = patients.map((p) => p._id);
  const { socket } = useCaregiverSocket(patientIds, session?.user?.id);

  useEffect(() => {
    if (!socket) return;
    socket.on("emergency_alert", (data) => {
      setActiveEmergencyAlert(data);
      toast.error(`🆘 EMERGENCY: ${data.patientName} pressed HELP!`, { duration: 0 });
    });
    return () => {
      socket.off("emergency_alert");
    };
  }, [socket]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/caregiver/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const token = session?.accessToken;
    if (token) localStorage.setItem("caregiverToken", token);
    api.get("/api/caregiver/patients").then((r) => {
      setPatients(r.data);
      const pid = searchParams.get("patient") || r.data[0]?._id;
      if (pid) setSelectedPatient(pid);
    }).finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!selectedPatient) return;
    api.get(`/api/caregiver/patients/${selectedPatient}/reminders`)
      .then((r) => setReminders(r.data))
      .catch(() => toast.error("Failed to load reminders"));
  }, [selectedPatient]);

  const deleteReminder = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/api/caregiver/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r._id !== id));
      toast.success("Reminder deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const toggleActive = async (reminder) => {
    try {
      const res = await api.put(`/api/caregiver/reminders/${reminder._id}`, { isActive: !reminder.isActive });
      setReminders((prev) => prev.map((r) => r._id === reminder._id ? res.data : r));
    } catch { toast.error("Failed to update"); }
  };

  const handleSave = (saved) => {
    setReminders((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      if (idx >= 0) { const u = [...prev]; u[idx] = saved; return u; }
      return [...prev, saved].sort((a, b) => a.time.localeCompare(b.time));
    });
  };

  if (loading) return (
    <div className="pt-16 md:pt-0 flex items-center justify-center h-96">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">⏰</div><p className="text-care-muted">Loading...</p></div>
    </div>
  );

  return (
    <div className="pt-16 md:pt-0 max-w-3xl">
      {/* Emergency Alert */}
      {activeEmergencyAlert && (
        <EmergencyAlert
          alert={activeEmergencyAlert}
          onDismiss={() => setActiveEmergencyAlert(null)}
        />
      )}

      {modal && (
        <ReminderModal
          reminder={modal === "add" ? null : modal}
          patientId={selectedPatient}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-care-text">Reminders</h1>
          <p className="text-care-muted mt-1">Schedule daily reminders for patients</p>
        </div>
        {selectedPatient && (
          <button
            onClick={() => setModal("add")}
            className="bg-care-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-care-secondary transition-all"
          >
            + Add Reminder
          </button>
        )}
      </div>

      {/* Patient selector */}
      {patients.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {patients.map((p) => (
            <button
              key={p._id}
              onClick={() => setSelectedPatient(p._id)}
              className={`rounded-xl px-4 py-2 font-bold text-sm transition-all ${
                selectedPatient === p._id ? "bg-care-primary text-white" : "bg-white border border-care-border text-care-muted"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {!selectedPatient ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-care-border">
          <p className="text-care-muted">Add a patient first</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-care-border text-center shadow-sm">
          <div className="text-6xl mb-4">⏰</div>
          <p className="text-xl font-bold text-care-text mb-2">No reminders yet</p>
          <p className="text-care-muted mb-6">Add reminders to help the patient with their daily routine</p>
          <button onClick={() => setModal("add")} className="bg-care-primary text-white rounded-xl px-8 py-3 font-bold">
            Add First Reminder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r._id} className={`bg-white rounded-2xl p-5 border shadow-sm ${r.isActive ? "border-care-border" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl">{REMINDER_ICONS[r.type] || "🔔"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-care-text">{r.time}</span>
                    <span className="text-xs bg-care-bg text-care-primary px-2 py-0.5 rounded-lg font-bold capitalize">{r.type}</span>
                    {!r.isActive && <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-lg">Inactive</span>}
                  </div>
                  <p className="text-care-text font-medium mb-1">{r.message}</p>
                  <p className="text-xs text-care-muted">
                    {r.days.map((d) => DAY_LABELS[d]).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(r)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${r.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                    {r.isActive ? "On" : "Off"}
                  </button>
                  <button onClick={() => setModal(r)} className="text-care-primary hover:text-care-secondary font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                    Edit
                  </button>
                  <button onClick={() => deleteReminder(r._id)} className="text-red-400 hover:text-red-600 font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
