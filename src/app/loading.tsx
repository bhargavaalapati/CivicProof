export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-3 text-center">
        <div className="h-2.5 w-32 bg-slate-200 rounded-full mx-auto animate-pulse" />
        <div className="h-7 w-64 bg-slate-200 rounded-lg mx-auto animate-pulse" />
        <p className="text-xs text-slate-500">Loading CivicProof workspace...</p>
      </div>
    </main>
  );
}