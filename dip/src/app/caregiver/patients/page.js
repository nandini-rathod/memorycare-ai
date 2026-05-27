"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCaregiverSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import EmergencyAlert from "@/components/caregiver/EmergencyAlert";

const STAGES = ["mild", "moderate", "severe"];
const TONES = ["warm", "professional", "playful"];

function PatientModal({ patient, onClose, onSave }) {
  const isEdit = !!patient?._id;
  const [form, setForm] = useState(
    patient || { name: "", age: "", cognitiveStage: "mild", aiTone: "warm", emergencyContact: "" }
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.age) return toast.error("Name and age are required");
    setLoading(true);
    try {
      const res = isEdit
        ? await api.put(`/api/caregiver/patients/${patient._id}`, form)
        : await api.post("/api/caregiver/patients", form);
      onSave(res.data);
      toast.success(isEdit ? "Patient updated!" : "Patient added!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-care-text mb-6">
          {isEdit ? "Edit Patient" : "Add New Patient"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Patient Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Age *</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              placeholder="e.g. 74"
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Cognitive Stage</label>
            <select
              value={form.cognitiveStage}
              onChange={(e) => setForm({ ...form, cognitiveStage: e.target.value })}
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary bg-white"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">AI Tone</label>
            <select
              value={form.aiTone}
              onChange={(e) => setForm({ ...form, aiTone: e.target.value })}
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary bg-white"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-care-text block mb-1">Emergency Contact</label>
            <input
              value={form.emergencyContact || ""}
              onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              placeholder="Phone number"
              className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-base outline-none focus:border-care-primary"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-care-border rounded-xl py-3 font-bold text-care-muted hover:text-care-text transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-care-primary text-white rounded-xl py-3 font-bold hover:bg-care-secondary transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [modal, setModal] = useState(null); // null | 'add' | patient object
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
    api.get("/api/caregiver/patients")
      .then((r) => setPatients(r.data))
      .catch(() => toast.error("Failed to load patients"))
      .finally(() => setLoading(false));
  }, [status]);

  const handleSave = (saved) => {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [...prev, saved];
    });
  };

  const handleDelete = async (patientId) => {
    if (!confirm("Are you sure? This patient will be moved to Past Patients")) return;
    try {
      await api.delete(`/api/caregiver/patients/${patientId}`);
      setPatients((prev) => prev.filter((p) => p._id !== patientId));
      toast.success("Patient moved to past patients");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete patient");
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stageColor = (stage) =>
    stage === "mild" ? "bg-green-50 text-green-600" :
    stage === "moderate" ? "bg-yellow-50 text-yellow-600" :
    "bg-red-50 text-red-600";

  return (
    <div className="pt-16 md:pt-0 max-w-4xl">
      {/* Emergency Alert */}
      {activeEmergencyAlert && (
        <EmergencyAlert
          alert={activeEmergencyAlert}
          onDismiss={() => setActiveEmergencyAlert(null)}
        />
      )}

      {modal && (
        <PatientModal
          patient={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-care-text">Patients</h1>
          <p className="text-care-muted mt-1">Manage your patients' profiles</p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="bg-care-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-care-secondary transition-all flex items-center gap-2"
        >
          + Add Patient
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3 animate-pulse">👴</div>
          <p className="text-care-muted">Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-care-border text-center shadow-sm">
          <div className="text-6xl mb-4">👴</div>
          <h3 className="text-xl font-bold text-care-text mb-2">No patients yet</h3>
          <p className="text-care-muted mb-6">Add your first patient to get started</p>
          <button
            onClick={() => setModal("add")}
            className="bg-care-primary text-white rounded-xl px-8 py-3 font-bold hover:bg-care-secondary transition-all"
          >
            Add First Patient
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {patients.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl p-6 border border-care-border shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl flex-shrink-0">
                  👴
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-xl font-bold text-care-text">{p.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${stageColor(p.cognitiveStage)}`}>
                      {p.cognitiveStage}
                    </span>
                    <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg">
                      AI: {p.aiTone}
                    </span>
                  </div>
                  <p className="text-care-muted text-sm">
                    Age {p.age}
                    {p.emergencyContact ? ` · 📞 ${p.emergencyContact}` : ""}
                  </p>
                  {p.familyMembers?.length > 0 && (
                    <p className="text-sm text-care-muted mt-1">
                      👨‍👩‍👧 {p.familyMembers.map((f) => f.name).join(", ")}
                    </p>
                  )}
                  {/* Patient ID for .env */}
                  <div className="mt-2 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                    <p className="text-xs text-gray-400 font-mono">Patient ID: {p._id}</p>
                    <p className="text-xs text-gray-400">Set in .env.local as NEXT_PUBLIC_PATIENT_ID</p>
                  </div>
                  {/* Registration Date */}
                  <p className="text-xs text-gray-500 mt-2 font-semibold">
                    Registered: {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setModal(p)}
                    className="text-care-primary hover:text-care-secondary font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition-all whitespace-nowrap"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-all whitespace-nowrap"
                  >
                    Delete
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
