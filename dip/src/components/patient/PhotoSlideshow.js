"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import Image from "next/image";

export default function PhotoSlideshow({ patientId, speak }) {
  const [photos, setPhotos] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/photos/${patientId}`)
      .then((r) => setPhotos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [patientId]);

  const speakCaption = useCallback((photo) => {
    if (photo?.caption) speak(photo.caption);
  }, [speak]);

  useEffect(() => {
    if (photos.length > 0) {
      speakCaption(photos[current]);
    }
  }, [current, photos]);

  // Auto-advance every 10 seconds
  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % photos.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4 animate-pulse">📸</div>
        <p className="text-xl text-gray-400">Loading photos...</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-card border border-patient-border">
        <div className="text-6xl mb-4">📷</div>
        <p className="text-2xl font-bold text-patient-text mb-2">No photos yet</p>
        <p className="text-lg text-gray-400">Your family member will add photos soon!</p>
      </div>
    );
  }

  const photo = photos[current];

  return (
    <div>
      {/* Main photo */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-card border border-patient-border mb-4">
        <div className="relative w-full" style={{ height: "320px" }}>
          <img
            src={photo.imageUrl}
            alt={photo.personName || "Family member"}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 text-center">
          {photo.personName && (
            <p className="text-2xl font-bold text-patient-primary mb-2">
              {photo.personName}
              {photo.relation ? ` — ${photo.relation}` : ""}
            </p>
          )}
          <p className="text-xl text-patient-text leading-relaxed">{photo.caption}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + photos.length) % photos.length)}
          className="flex-1 bg-white rounded-2xl py-4 text-xl font-bold text-patient-primary border border-patient-border shadow-sm hover:bg-patient-bg transition-all"
        >
          ← Previous
        </button>
        <span className="text-gray-400 font-medium text-lg whitespace-nowrap">
          {current + 1} / {photos.length}
        </span>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % photos.length)}
          className="flex-1 bg-white rounded-2xl py-4 text-xl font-bold text-patient-primary border border-patient-border shadow-sm hover:bg-patient-bg transition-all"
        >
          Next →
        </button>
      </div>

      {/* Read aloud button */}
      <button
        onClick={() => speakCaption(photo)}
        className="w-full mt-4 bg-patient-primary text-white rounded-2xl py-4 text-xl font-bold hover:bg-patient-secondary transition-all"
      >
        🔊 Read aloud
      </button>

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all ${
                i === current ? "bg-patient-primary scale-125" : "bg-patient-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
