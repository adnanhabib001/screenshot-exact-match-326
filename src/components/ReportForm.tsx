import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Upload, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, DIVISIONS, LOCATIONS } from "@/lib/bd-locations";

const schema = z.object({
  extortionist_name: z.string().trim().min(1, "নাম/ডাকনাম দিন").max(120),
  organization: z.string().trim().max(120).optional(),
  category: z.string().min(1, "খাত নির্বাচন করুন"),
  amount: z.number({ message: "সঠিক পরিমাণ দিন" }).min(1, "সঠিক পরিমাণ দিন").max(1_000_000_000),
  division: z.string().min(1, "বিভাগ নির্বাচন করুন"),
  district: z.string().min(1, "জেলা নির্বাচন করুন"),
  upazila: z.string().min(1, "উপজেলা নির্বাচন করুন"),
  landmark: z.string().trim().max(200).optional(),
});

const input = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

export function ReportForm() {
  const [f, setF] = useState({ extortionist_name: "", organization: "", category: "", amount: "", division: "", district: "", upazila: "", landmark: "" });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState<string | null>(null);

  const set = (k: keyof typeof f, v: string) =>
    setF((p) => ({ ...p, [k]: v, ...(k === "division" ? { district: "", upazila: "" } : {}), ...(k === "district" ? { upazila: "" } : {}) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ ...f, amount: Number(f.amount), organization: f.organization || undefined, landmark: f.landmark || undefined });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (file && (file.size > 5 * 1024 * 1024 || !file.type.startsWith("image/"))) return setError("ছবি ৫MB-এর কম হতে হবে");
    setBusy(true);
    let image_url: string | null = null;
    if (file) {
      const path = `${crypto.randomUUID()}.${file.name.split(".").pop() ?? "jpg"}`;
      const { error: upErr } = await supabase.storage.from("proofs").upload(path, file);
      if (!upErr) image_url = path;
    }
    const tracking_id = `#CB-${Math.floor(10000 + Math.random() * 90000)}`;
    const { error: insErr } = await supabase.from("reports").insert({ ...parsed.data, organization: parsed.data.organization ?? null, landmark: parsed.data.landmark ?? null, image_url, tracking_id });
    setBusy(false);
    if (insErr) return setError("জমা দেওয়া যায়নি, আবার চেষ্টা করুন");
    setTracking(tracking_id);
    setF({ extortionist_name: "", organization: "", category: "", amount: "", division: "", district: "", upazila: "", landmark: "" });
    setFile(null);
  };

  const districts = f.division ? Object.keys(LOCATIONS[f.division]) : [];
  const upazilas = f.division && f.district ? LOCATIONS[f.division][f.district] : [];

  return (
    <section id="report" className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"><ShieldCheck className="h-3.5 w-3.5" /> কোনো লগইন নেই · ১০০% বেনামী</span>
        <h2 className="mt-3 font-display text-3xl md:text-4xl">বেনামী রিপোর্ট জমা দিন</h2>
      </div>
      <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm md:grid-cols-2">
        <label className="space-y-1 text-sm"><span>চাঁদাবাজের নাম/ডাকনাম *</span>
          <input className={input} value={f.extortionist_name} onChange={(e) => set("extortionist_name", e.target.value)} maxLength={120} /></label>
        <label className="space-y-1 text-sm"><span>সংগঠন/পরিচয় (ঐচ্ছিক)</span>
          <input className={input} value={f.organization} onChange={(e) => set("organization", e.target.value)} maxLength={120} /></label>
        <label className="space-y-1 text-sm"><span>খাত *</span>
          <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">নির্বাচন করুন</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select></label>
        <label className="space-y-1 text-sm"><span>চাঁদার পরিমাণ (৳) *</span>
          <input type="number" min={1} className={input} value={f.amount} onChange={(e) => set("amount", e.target.value)} /></label>
        <label className="space-y-1 text-sm"><span>বিভাগ *</span>
          <select className={input} value={f.division} onChange={(e) => set("division", e.target.value)}>
            <option value="">বিভাগ</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}
          </select></label>
        <label className="space-y-1 text-sm"><span>জেলা *</span>
          <select className={input} value={f.district} disabled={!f.division} onChange={(e) => set("district", e.target.value)}>
            <option value="">জেলা</option>{districts.map((d) => <option key={d}>{d}</option>)}
          </select></label>
        <label className="space-y-1 text-sm"><span>উপজেলা/থানা *</span>
          <select className={input} value={f.upazila} disabled={!f.district} onChange={(e) => set("upazila", e.target.value)}>
            <option value="">উপজেলা</option>{upazilas.map((d) => <option key={d}>{d}</option>)}
          </select></label>
        <label className="space-y-1 text-sm"><span>নির্দিষ্ট স্থান/ল্যান্ডমার্ক</span>
          <input className={input} value={f.landmark} onChange={(e) => set("landmark", e.target.value)} maxLength={200} /></label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input p-4 text-sm md:col-span-2">
          <Upload className="h-5 w-5 text-primary" />
          <span className="truncate">{file ? file.name : "প্রমাণের ছবি আপলোড করুন (ঐচ্ছিক, সর্বোচ্চ ৫MB)"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
        <button disabled={busy} className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground shadow transition hover:brightness-110 disabled:opacity-60 md:col-span-2">
          {busy ? "জমা হচ্ছে..." : "রিপোর্ট জমা দিন (বেনামে)"}
        </button>
      </form>

      {tracking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/60 p-4 animate-in fade-in" onClick={() => setTracking(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center shadow-2xl animate-in zoom-in-90" onClick={(e) => e.stopPropagation()}>
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary animate-in spin-in-12" />
            <h3 className="mt-4 font-display text-2xl">রিপোর্ট জমা হয়েছে!</h3>
            <p className="mt-2 text-sm text-muted-foreground">আপনার বেনামী ট্র্যাকিং আইডি</p>
            <p className="mt-2 rounded-lg bg-secondary py-3 font-mono text-2xl font-bold text-accent">{tracking}</p>
            <button onClick={() => setTracking(null)} className="mt-6 w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground">ঠিক আছে</button>
          </div>
        </div>
      )}
    </section>
  );
}
