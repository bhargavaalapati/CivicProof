import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#FAF9F6]" />}>
      <AuthCard initialMode="signin" />
    </Suspense>
  );
}