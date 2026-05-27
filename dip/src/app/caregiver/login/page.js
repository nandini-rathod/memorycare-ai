"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "family" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error(res.error || "Login failed");
      } else {
        toast.success("Welcome back! 👋");
        router.push("/caregiver/dashboard");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save token and auto-login
      localStorage.setItem("caregiverToken", data.token);
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      toast.success("Account created! Welcome 🎉");
      router.push("/caregiver/dashboard");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-care-bg via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-care-primary shadow-lg mb-3">
              <span className="text-3xl">🧠</span>
            </div>
          </Link>
          <h1 className="text-3xl font-serif text-care-text">MemoryCare</h1>
          <p className="text-care-muted mt-1">Caregiver Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-card border border-care-border">
          {/* Tabs */}
          <div className="flex bg-care-bg rounded-2xl p-1 mb-6">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl py-2.5 text-base font-bold capitalize transition-all ${
                  mode === m
                    ? "bg-white text-care-primary shadow-sm"
                    : "text-care-muted hover:text-care-text"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-sm font-bold text-care-text block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full border-2 border-care-border rounded-xl px-4 py-3 text-base font-medium outline-none focus:border-care-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-care-text block mb-1.5">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border-2 border-care-border rounded-xl px-4 py-3 text-base font-medium outline-none focus:border-care-primary transition-colors bg-white"
                  >
                    <option value="family">Family Member</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="text-sm font-bold text-care-text block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="your@email.com"
                className="w-full border-2 border-care-border rounded-xl px-4 py-3 text-base font-medium outline-none focus:border-care-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-care-text block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border-2 border-care-border rounded-xl px-4 py-3 text-base font-medium outline-none focus:border-care-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-care-primary text-white rounded-xl py-3.5 text-base font-bold hover:bg-care-secondary transition-all disabled:opacity-50 mt-2"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-care-muted text-sm mt-4">
          <Link href="/" className="hover:text-care-primary transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
