export const metadata = {
  title: "MemoryCare — Your Daily Companion",
};

export default function PatientLayout({ children }) {
  return (
    <div className="patient-interface min-h-screen bg-patient-bg">
      {children}
    </div>
  );
}
