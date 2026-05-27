"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useCaregiverSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import EmergencyAlert from "@/components/caregiver/EmergencyAlert";

function StatCard({ icon, label, value, color, href }) {
  const content = (
    <div className={`bg-white rounded-2xl p-5 border border-care-border shadow-sm card-hover ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${color}`}>{label}</span>
      </div>
      <p className="text-3xl font-bold text-care-text">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ patients: 0, reminders: 0, unreadAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/caregiver/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const token = session?.accessToken;
    if (token) localStorage.setItem("caregiverToken", token);

    loadData();
  }, [status, session]);

  const loadData = async () => {
    try {
      const pRes = await api.get("/api/caregiver/patients");
      setPatients(pRes.data);

      // Load unacknowledged distress events for all patients
      let allAlerts = [];
      for (const p of pRes.data.slice(0, 3)) {
        const dRes = await api.get(`/api/caregiver/patients/${p._id}/distress`);
        const unread = dRes.data.filter((e) => !e.acknowledged).slice(0, 5);
        allAlerts.push(...unread.map((a) => ({ ...a, patientName: p.name })));
      }
      setAlerts(allAlerts.slice(0, 10));
      setStats({
        patients: pRes.data.length,
        unreadAlerts: allAlerts.length,
      });
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Real-time socket
  const patientIds = patients.map((p) => p._id);
  const { socket } = useCaregiverSocket(patientIds, session?.user?.id);

  useEffect(() => {
    if (!socket) return;
    socket.on("distress_alert", (data) => {
      toast.error(`🚨 ${data.patientName} needs attention! Score: ${data.score}/10`, {
        duration: 8000,
      });
      setAlerts((prev) => [{ ...data, _id: Date.now() }, ...prev].slice(0, 10));
      setStats((s) => ({ ...s, unreadAlerts: s.unreadAlerts + 1 }));
    });
    socket.on("emergency_alert", (data) => {
      setActiveEmergencyAlert(data);
      toast.error(`🆘 EMERGENCY: ${data.patientName} pressed HELP!`, { duration: 0 });
    });
    return () => {
      socket.off("distress_alert");
      socket.off("emergency_alert");
    };
  }, [socket]);

  const acknowledgeAlert = async (alertId, patientId) => {
    try {
      await api.patch(`/caregiver/distress/${alertId}/acknowledge`, { notes: "Acknowledged from dashboard" });
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      setStats((s) => ({ ...s, unreadAlerts: Math.max(0, s.unreadAlerts - 1) }));
      toast.success("Alert acknowledged");
    } catch {
      toast.error("Failed to acknowledge");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="pt-16 md:pt-0">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-pulse">🧠</div>
            <p className="text-care-muted font-semibold">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:pt-0 max-w-5xl">
      {/* Emergency Alert */}
      {activeEmergencyAlert && (
        <EmergencyAlert
          alert={activeEmergencyAlert}
          onDismiss={() => setActiveEmergencyAlert(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-care-text">
          Welcome back, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-care-muted mt-1">Here's what's happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon="👴" label="Patients" value={stats.patients} color="bg-blue-50 text-blue-600" href="/caregiver/patients" />
        <StatCard icon="⏰" label="Active" value="Reminders" color="bg-green-50 text-green-600" href="/caregiver/reminders" />
        <StatCard
          icon="🚨"
          label="Alerts"
          value={stats.unreadAlerts || 0}
          color={stats.unreadAlerts > 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-400"}
        />
      </div>

      {/* Patients */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-care-text">Your Patients</h2>
          <Link href="/caregiver/patients" className="text-care-primary font-semibold text-sm hover:underline">
            View all →
          </Link>
        </div>
        {patients.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-care-border text-center shadow-sm">
            <div className="text-4xl mb-3">👴</div>
            <p className="font-semibold text-care-text mb-2">No patients yet</p>
            <Link href="/caregiver/patients">
              <button className="bg-care-primary text-white rounded-xl px-6 py-2.5 text-sm font-bold mt-2 hover:bg-care-secondary transition-all">
                Add Patient
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map((p) => (
              <div key={p._id} className="bg-white rounded-2xl p-5 border border-care-border shadow-sm card-hover">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                    {p.profilePhoto ? (
                      <img src={p.profilePhoto} alt={p.name} className="w-full h-full rounded-2xl object-cover" />
                    ) : "👴"}
                  </div>
                  <div>
                    <h3 className="font-bold text-care-text text-lg">{p.name}</h3>
                    <p className="text-care-muted text-sm">Age {p.age} · {p.cognitiveStage} stage</p>
                  </div>
                  <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${
                    p.cognitiveStage === "mild" ? "bg-green-50 text-green-600" :
                    p.cognitiveStage === "moderate" ? "bg-yellow-50 text-yellow-600" :
                    "bg-red-50 text-red-600"
                  }`}>
                    {p.cognitiveStage}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/caregiver/reminders?patient=${p._id}`} className="flex-1">
                    <button className="w-full bg-care-bg text-care-primary rounded-xl py-2 text-xs font-bold hover:bg-blue-50 transition-all">
                      ⏰ Reminders
                    </button>
                  </Link>
                  <Link href={`/caregiver/logs?patient=${p._id}`} className="flex-1">
                    <button className="w-full bg-care-bg text-care-primary rounded-xl py-2 text-xs font-bold hover:bg-blue-50 transition-all">
                      💬 Logs
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Distress Alerts */}
      {alerts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-care-text mb-4">
            🚨 Unacknowledged Alerts ({alerts.length})
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert._id}
                className="bg-white rounded-2xl p-4 border-2 border-red-100 shadow-sm flex items-start gap-4"
              >
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-care-text">{alert.patientName}</p>
                    <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-lg font-bold">
                      Score: {alert.distressScore}/10
                    </span>
                  </div>
                  <p className="text-care-muted text-sm">
                    {alert.triggerType?.replace("_", " ")} · {alert.messageSnippet?.slice(0, 80)}
                  </p>
                  <p className="text-xs text-care-muted mt-1">
                    {new Date(alert.timestamp || alert.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert._id, alert.patientId)}
                  className="bg-green-500 text-white rounded-xl px-4 py-2 text-xs font-bold hover:bg-green-600 transition-all whitespace-nowrap"
                >
                  ✓ Ack
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
