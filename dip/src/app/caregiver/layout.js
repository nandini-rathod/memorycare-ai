import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CaregiverSidebar from "@/components/caregiver/CaregiverSidebar";

export const metadata = { title: "MemoryCare — Caregiver Dashboard" };

export default async function CaregiverLayout({ children }) {
  const session = await getServerSession();
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;

  return (
    <div className="min-h-screen bg-care-bg flex">
      <CaregiverSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
