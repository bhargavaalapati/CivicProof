"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";


function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.08 3.56-5.15 3.56-8.65Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-3c-1.07.72-2.45 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.27A7.2 7.2 0 0 1 4.88 12c0-.79.14-1.56.37-2.27v-3.1H1.25A12 12 0 0 0 0 12c0 1.94.46 3.77 1.25 5.37l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.25 6.63l4 3.1c.95-2.85 3.61-4.97 6.75-4.97Z"
      />
    </svg>
  );
}

export function AuthCard({ initialMode }: { initialMode: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback_failed"
      ? "Google sign-in could not complete. Please verify Google OAuth is enabled in Supabase or use Email sign-in."
      : null
  );

  const isSignup = initialMode === "signup";

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isSignup && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (!isSignup) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message);
          toast.error("Authentication failed", err.message);
        } else {
          toast.success("Welcome back", "Signed in to your CivicProof workspace.");
          router.refresh();
          router.push("/reports");
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/reports` },
        });
        if (err) {
          setError(err.message);
          toast.error("Authentication failed", err.message);
        } else if (data.session) {
          toast.success("Account created", "Welcome to CivicProof.");
          router.refresh();
          router.push("/reports");
        } else {
          setMessage("Account created! Check your email inbox to confirm your address, then sign in.");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/reports`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (err) {
      setError(
        err.message.includes("provider is not enabled")
          ? "Google sign-in is not yet enabled in your Supabase Auth settings. Enable it in Supabase → Authentication → Providers → Google, or sign in with Email below."
          : err.message
      );
      setGoogleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-slate-900 grid lg:grid-cols-12">
      {/* Left Calm Editorial Panel (Desktop) */}
      <aside className="hidden lg:flex lg:col-span-5 bg-slate-950 text-white p-10 flex-col justify-between">
        <div className="space-y-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-white">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            CivicProof
          </Link>

          <div className="space-y-4 pt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
              GVMC Ward 18 – MVP Colony
            </p>
            <h1 className="font-serif text-4xl leading-tight">
              Keep your civic evidence private, structured, and verifiable.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Separate municipal ticket closure from citizen confirmation with private storage, EXIF stripping,
              and reproducible PDF follow-up packets.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-slate-300 pt-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Private per-user storage backed by Postgres Row-Level Security.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>No Aadhaar or phone numbers collected—ever.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Provisional AI observations never auto-close your reports.</span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-400">
          Created for IdeaForge • Independent citizen prototype.
        </p>
      </aside>

      {/* Right Auth Form Column */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-5 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-950 min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <Link href="/" className="lg:hidden font-bold text-base text-slate-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" /> CivicProof
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 mb-6 text-sm font-semibold">
              <Link
                href="/login"
                className={`text-center py-2 rounded-lg transition-colors ${
                  !isSignup ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className={`text-center py-2 rounded-lg transition-colors ${
                  isSignup ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                {isSignup ? "Create your citizen workspace" : "Welcome back"}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {isSignup
                  ? "Start organizing before-and-after evidence in Ward 18."
                  : "Sign in to access your private civic reports and packets."}
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-800">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-900">
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="w-full min-h-[46px] rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-sm hover:bg-slate-50 inline-flex items-center justify-center gap-2.5 disabled:opacity-50 transition-colors"
            >
              <GoogleIcon />
              {googleLoading ? "Redirecting to Google..." : isSignup ? "Sign up with Google" : "Continue with Google"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              <span>OR CONTINUE WITH EMAIL</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-800 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Re-enter your password"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full min-h-[46px] rounded-xl bg-slate-950 text-white font-semibold text-sm hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Please wait..." : isSignup ? "Create Citizen Account" : "Sign In to Workspace"}
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-500 border-t border-slate-100 pt-4 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Your uploaded photos are EXIF-stripped and private to your account under RLS.</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}