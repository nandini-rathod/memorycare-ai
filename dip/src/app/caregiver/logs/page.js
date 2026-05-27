"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useCaregiverSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import EmergencyAlert from "@/components/caregiver/EmergencyAlert";

function ConversationLog({ log }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-care-border shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-care-bg transition-all"
      >
        <span className="text-xl">💬</span>
        <div className="flex-1">
          <p className="font-bold text-care-text text-sm">
            {new Date(log.startTime || log.createdAt).toLocaleString()}
          </p>
          <p className="text-care-muted text-xs">
            {log.messages?.length || 0} messages
            {log.distressScore > 0 && (
              <span className="ml-2 text-red-500 font-bold">· Distress: {log.distressScore}/10</span>
            )}
          </p>
        </div>
        <span className="text-care-muted text-sm">{open ? "▲" : "▼"}</span>
      </button>
      {open && log.messages?.length > 0 && (
        <div className="border-t border-care-border p-4 space-y-2 max-h-80 overflow-y-auto">
          {log.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "patient" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-xl px-4 py-2 max-w-xs text-sm ${
                m.role === "patient" ? "bg-care-primary text-white" : "bg-care-bg text-care-text border border-care-border"
              }`}>
                <p className={`text-xs font-bold mb-0.5 ${m.role === "patient" ? "text-white/70" : "text-care-muted"}`}>
                  {m.role === "patient" ? "Patient" : "AI"}
                </p>
                {m.content}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && log.extractedFacts?.length > 0 && (
        <div className="border-t border-care-border p-4">
          <p className="text-xs font-bold text-care-text mb-2">📝 Extracted Facts:</p>
          <ul className="space-y-1">
            {log.extractedFacts.map((f, i) => (
              <li key={i} className="text-xs text-care-muted flex gap-2">
                <span>•</span><span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DistressAlert({ alert, onAcknowledge }) {
  const TRIGGER_LABELS = {
    confusion_keyword: "Confusion keyword detected",
    short_response: "Very short response",
    repeated_question: "Repeated question",
    help_button: "Help button pressed",
    negative_emotion: "Negative emotion detected",
  };
  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${alert.acknowledged ? "border-green-100 opacity-70" : "border-red-100"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{alert.triggerType === "help_button" ? "🆘" : "⚠️"}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-care-text text-sm">{TRIGGER_LABELS[alert.triggerType] || alert.triggerType}</p>
            <span className={`text-xs px-2 py-0.5 rounded-lg font-bold ${alert.distressScore >= 8 ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}`}>
              Score: {alert.distressScore}/10
            </span>
          </div>
          {alert.messageSnippet && (
            <p className="text-care-muted text-xs italic mb-1">"{alert.messageSnippet}"</p>
          )}
          <p className="text-xs text-care-muted">{new Date(alert.timestamp || alert.createdAt).toLocaleString()}</p>
          {alert.acknowledged && (
            <p className="text-xs text-green-600 font-semibold mt-1">
              ✓ Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt).toLocaleString()}
            </p>
          )}
        </div>
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert._id)}
            className="bg-green-500 text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-green-600 transition-all whitespace-nowrap"
          >
            ✓ Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [logs, setLogs] = useState([]);
  const [distressEvents, setDistressEvents] = useState([]);
  const [tab, setTab] = useState("distress");
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
    Promise.all([
      api.get(`/api/caregiver/patients/${selectedPatient}/logs`),
      api.get(`/api/caregiver/patients/${selectedPatient}/distress`),
    ]).then(([logsRes, distressRes]) => {
      setLogs(logsRes.data);
      setDistressEvents(distressRes.data);
    }).catch(() => toast.error("Failed to load logs"));
  }, [selectedPatient]);

  const acknowledgeDistress = async (alertId) => {
    try {
      await api.patch(`/caregiver/distress/${alertId}/acknowledge`, { notes: "Acknowledged" });
      setDistressEvents((prev) => prev.map((e) =>
        e._id === alertId ? { ...e, acknowledged: true, acknowledgedBy: session.user.name, acknowledgedAt: new Date() } : e
      ));
      toast.success("Alert acknowledged");
    } catch { toast.error("Failed"); }
  };

  const unreadCount = distressEvents.filter((e) => !e.acknowledged).length;

  if (loading) return (
    <div className="pt-16 md:pt-0 flex items-center justify-center h-96">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">💬</div><p className="text-care-muted">Loading...</p></div>
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-care-text">Logs & Alerts</h1>
        <p className="text-care-muted mt-1">View conversation history and distress alerts</p>
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

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 border border-care-border shadow-sm mb-6">
        <button onClick={() => setTab("distress")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === "distress" ? "bg-care-primary text-white shadow-sm" : "text-care-muted"}`}>
          🚨 Alerts {unreadCount > 0 && <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{unreadCount}</span>}
        </button>
        <button onClick={() => setTab("logs")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${tab === "logs" ? "bg-care-primary text-white shadow-sm" : "text-care-muted"}`}>
          💬 Conversations ({logs.length})
        </button>
      </div>

      {tab === "distress" && (
        <div className="space-y-3">
          {distressEvents.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-care-border">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-bold text-care-text">No distress events</p>
              <p className="text-care-muted text-sm mt-1">The patient is doing well!</p>
            </div>
          ) : (
            distressEvents.map((alert) => (
              <DistressAlert key={alert._id} alert={alert} onAcknowledge={acknowledgeDistress} />
            ))
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-care-border">
              <div className="text-4xl mb-2">💬</div>
              <p className="font-bold text-care-text">No conversations yet</p>
              <p className="text-care-muted text-sm mt-1">Logs will appear after the patient chats with the AI</p>
            </div>
          ) : (
            logs.map((log) => <ConversationLog key={log._id} log={log} />)
          )}
        </div>
      )}
    </div>
  );
}
