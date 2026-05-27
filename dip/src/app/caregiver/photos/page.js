"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCaregiverSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";
import EmergencyAlert from "@/components/caregiver/EmergencyAlert";

export default function PhotosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ caption: "", personName: "", relation: "" });
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [activeEmergencyAlert, setActiveEmergencyAlert] = useState(null);
  const fileRef = useRef();

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
      if (r.data[0]) setSelectedPatient(r.data[0]._id);
    }).finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!selectedPatient) return;
    api.get(`/api/photos/${selectedPatient}`)
      .then((r) => setPhotos(r.data))
      .catch(() => toast.error("Failed to load photos"));
  }, [selectedPatient]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!previewFile) return toast.error("Select an image first");
    if (!form.caption) return toast.error("Caption is required");
    if (!selectedPatient) return toast.error("Select a patient first");

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", previewFile);
      formData.append("caption", form.caption);
      formData.append("personName", form.personName);
      formData.append("relation", form.relation);

      const res = await api.post(`/api/photos/${selectedPatient}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotos((prev) => [...prev, res.data]);
      setForm({ caption: "", personName: "", relation: "" });
      setPreviewFile(null);
      setPreviewUrl("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed. Check Cloudinary settings.");
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await api.delete(`/api/photos/${photoId}`);
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));
      toast.success("Photo deleted");
    } catch { toast.error("Failed to delete"); }
  };

  if (loading) return (
    <div className="pt-16 md:pt-0 flex items-center justify-center h-96">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📸</div><p className="text-care-muted">Loading...</p></div>
    </div>
  );

  return (
    <div className="pt-16 md:pt-0 max-w-4xl">
      {/* Emergency Alert */}
      {activeEmergencyAlert && (
        <EmergencyAlert
          alert={activeEmergencyAlert}
          onDismiss={() => setActiveEmergencyAlert(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-care-text">Family Photos</h1>
        <p className="text-care-muted mt-1">Upload photos to help the patient recognize family members</p>
      </div>

      {/* Patient selector */}
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

      {!selectedPatient ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-care-border"><p className="text-care-muted">Add a patient first</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload form */}
          <div className="bg-white rounded-3xl p-6 border border-care-border shadow-sm">
            <h2 className="text-lg font-bold text-care-text mb-4">Upload New Photo</h2>

            {/* File picker */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all mb-4 ${previewUrl ? "border-care-primary" : "border-care-border hover:border-care-primary"}`}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
              ) : (
                <>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-care-muted font-medium">Click to select photo</p>
                  <p className="text-xs text-care-muted mt-1">JPG, PNG up to 10MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            <div className="space-y-3">
              <div>
                <label className="text-sm font-bold text-care-text block mb-1">Caption * (what AI will say)</label>
                <textarea
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="e.g. This is your daughter Priya, she loves you very much"
                  rows={3}
                  className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-care-primary resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-care-text block mb-1">Person's Name</label>
                <input value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })}
                  placeholder="e.g. Priya" className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-care-primary" />
              </div>
              <div>
                <label className="text-sm font-bold text-care-text block mb-1">Relation</label>
                <input value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}
                  placeholder="e.g. Daughter" className="w-full border-2 border-care-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-care-primary" />
              </div>
              <button onClick={handleUpload} disabled={uploading || !previewFile}
                className="w-full bg-care-primary text-white rounded-xl py-3 font-bold hover:bg-care-secondary transition-all disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          </div>

          {/* Gallery */}
          <div>
            <h2 className="text-lg font-bold text-care-text mb-4">
              Uploaded Photos ({photos.length})
            </h2>
            {photos.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-care-border text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-care-muted">No photos yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {photos.map((photo) => (
                  <div key={photo._id} className="bg-white rounded-2xl border border-care-border shadow-sm overflow-hidden flex gap-3 p-3">
                    <img src={photo.imageUrl} alt={photo.personName} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {photo.personName && <p className="font-bold text-care-text text-sm">{photo.personName} {photo.relation ? `(${photo.relation})` : ""}</p>}
                      <p className="text-care-muted text-xs leading-relaxed line-clamp-3">{photo.caption}</p>
                    </div>
                    <button onClick={() => deletePhoto(photo._id)} className="text-red-400 hover:text-red-600 font-bold p-1.5 rounded-lg hover:bg-red-50 transition-all flex-shrink-0 self-start">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
