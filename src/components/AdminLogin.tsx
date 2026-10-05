import { useEffect, useState } from "react";
import { Lock, LogOut, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { adminLogin, adminLogout } from "@/lib/admin.functions";

export function AdminLogin({ isAdmin, setAdmin }: { isAdmin: boolean; setAdmin: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(false);
    const { ok } = await login({ data: { password: pw } });
    setBusy(false);
    if (ok) { setAdmin(true); setOpen(false); setPw(""); } else setErr(true);
  };

  return (
    <>
      {isAdmin ? (
        <button onClick={async () => { await logout(); setAdmin(false); }} className="ml-2 inline-flex items-center gap-1 text-destructive" aria-label="Admin logout">
          <LogOut className="h-3 w-3" />অ্যাডমিন লগআউট
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="ml-2 inline-flex align-middle opacity-40 hover:opacity-100" aria-label="Admin">
          <Lock className="h-3 w-3" />
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-4 rounded-2xl bg-card p-6 text-left text-card-foreground shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-4 w-4" />অ্যাডমিন লগইন</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="পাসওয়ার্ড" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            {err && <p className="text-sm text-destructive">ভুল পাসওয়ার্ড</p>}
            <button disabled={busy} className="w-full rounded-lg bg-primary py-2 font-semibold text-primary-foreground disabled:opacity-60">প্রবেশ করুন</button>
          </form>
        </div>
      )}
    </>
  );
}
