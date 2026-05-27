import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-patient-bg via-white to-care-bg flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-patient-primary shadow-lg mb-4">
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="text-5xl font-serif text-patient-text mb-3">MemoryCare</h1>
          <p className="text-xl text-gray-500 font-medium">
            A compassionate AI companion for Alzheimer's patients
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Patient */}
          <Link href="/patient">
            <div className="bg-white rounded-3xl p-8 shadow-card card-hover border-2 border-patient-border cursor-pointer group">
              <div className="text-5xl mb-4">👴</div>
              <h2 className="text-2xl font-bold text-patient-primary mb-2">Patient Interface</h2>
              <p className="text-gray-500 text-base">
                Simple, calm interface for daily use by the patient
              </p>
              <div className="mt-4 inline-flex items-center text-patient-primary font-bold group-hover:gap-2 transition-all">
                Open →
              </div>
            </div>
          </Link>

          {/* Caregiver */}
          <Link href="/caregiver/login">
            <div className="bg-white rounded-3xl p-8 shadow-card card-hover border-2 border-care-border cursor-pointer group">
              <div className="text-5xl mb-4">👨‍⚕️</div>
              <h2 className="text-2xl font-bold text-care-primary mb-2">Caregiver Dashboard</h2>
              <p className="text-gray-500 text-base">
                Manage reminders, photos, and monitor patient wellbeing
              </p>
              <div className="mt-4 inline-flex items-center text-care-primary font-bold group-hover:gap-2 transition-all">
                Sign In →
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-10 text-gray-400 text-sm">
          Built with care for those who need it most 💙
        </p>
      </div>
    </main>
  );
}
