"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function PatientSelector({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    api
      .get("/api/patient")
      .then((r) => setPatients(r.data))
      .catch(() => toast.error("Failed to load patients"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (patientId) => {
    setSelectedId(patientId);
    localStorage.setItem("selectedPatientId", patientId);
    onSelectPatient(patientId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Patients Found</h2>
          <p className="text-gray-600">Please ask your caregiver to add a patient profile.</p>
        </div>
      </div>
    );
  }

  const getStageColor = (stage) => {
    switch (stage) {
      case "mild":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">Welcome</h1>
          <p className="text-center text-gray-600 mb-8">Please select a patient to continue</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patients.map((patient) => (
              <button
                key={patient._id}
                onClick={() => handleSelect(patient._id)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-lg transition-all hover:bg-indigo-50"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{patient.name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Age: {patient.age}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStageColor(patient.cognitiveStage)}`}>
                    {patient.cognitiveStage.charAt(0).toUpperCase() + patient.cognitiveStage.slice(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
