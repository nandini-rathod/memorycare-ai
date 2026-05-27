"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function PastPatientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/caregiver/login");
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const token = session?.accessToken;
    if (token) localStorage.setItem("caregiverToken", token);
    
    api.get("/api/caregiver/past-patients")
      .then((r) => setPatients(r.data))
      .catch(() => toast.error("Failed to load past patients"))
      .finally(() => setLoading(false));
  }, [status]);

  const stageColor = (stage) =>
    stage === "mild" ? "bg-green-50 text-green-600" :
    stage === "moderate" ? "bg-yellow-50 text-yellow-600" :
    "bg-red-50 text-red-600";

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysDuration = (createdAt, deletedAt) => {
    if (!createdAt || !deletedAt) return "";
    const start = new Date(createdAt);
    const end = new Date(deletedAt);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return days === 1 ? "1 day" : `${days} days`;
  };

  return (
    <div className="pt-16 md:pt-0 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-care-text">Past Patients</h1>
          <p className="text-care-muted mt-1">View patients you've archived</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3 animate-pulse">👴</div>
          <p className="text-care-muted">Loading past patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-care-border text-center shadow-sm">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-care-text mb-2">No past patients</h3>
          <p className="text-care-muted mb-6">Patients you delete will appear here</p>
          <button
            onClick={() => router.push("/caregiver/patients")}
            className="bg-care-primary text-white rounded-xl px-8 py-3 font-bold hover:bg-care-secondary transition-all"
          >
            Back to Patients
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {patients.map((p) => (
            <div key={p._id} className="bg-white rounded-2xl p-6 border border-care-border shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
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
                  
                  {/* Dates Information */}
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      📅 Registered: <span className="text-gray-600">{formatDate(p.createdAt)}</span>
                    </p>
                    <p className="text-sm font-semibold text-red-600">
                      🗑️ Removed: <span className="text-red-500">{formatDate(p.deletedAt)}</span>
                    </p>
                    <p className="text-sm font-semibold text-blue-700">
                      ⏱️ Duration: <span className="text-blue-600">{getDaysDuration(p.createdAt, p.deletedAt)}</span>
                    </p>
                  </div>

                  {/* Patient ID */}
                  <div className="mt-2 bg-gray-50 rounded-lg px-3 py-1.5 inline-block">
                    <p className="text-xs text-gray-400 font-mono">Patient ID: {p._id}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
