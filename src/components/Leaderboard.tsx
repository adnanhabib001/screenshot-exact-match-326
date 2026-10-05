import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import type { Report } from "@/hooks/useReports";
import { bn, DIVISIONS, LOCATIONS } from "@/lib/bd-locations";

export function Leaderboard({ reports }: { reports: Report[] }) {
  const [mode, setMode] = useState<"district" | "upazila">("district");
  const [div, setDiv] = useState("");
  const [dist, setDist] = useState("");

  const ranked = useMemo(() => {
    const since = Date.now() - 864e5;
    const m = new Map<string, { amount: number; count: number }>();
    reports.filter((r) => +new Date(r.created_at) >= since).forEach((r) => {
      const k = mode === "district" ? r.district : `${r.upazila}, ${r.district}`;
      const v = m.get(k) ?? { amount: 0, count: 0 };
      v.amount += Number(r.amount); v.count++; m.set(k, v);
    });
    return [...m.entries()].sort((a, b) => b[1].amount - a[1].amount).slice(0, 8);
  }, [reports, mode]);

  const filtered = reports.filter((r) => (!div || r.division === div) && (!dist || r.district === dist));
  const total = filtered.reduce((s, r) => s + Number(r.amount), 0);
  const verified = filtered.filter((r) => r.upvotes > r.downvotes && r.upvotes >= 5).length;
  const max = ranked[0]?.[1].amount ?? 1;

  const sel = "rounded-lg border border-input bg-background px-3 py-2 text-sm";
  return (
    <section id="stats" className="bg-secondary/50 py-16">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-2xl"><Trophy className="h-6 w-6 text-accent" />আজকের "সেরা" এলাকা</h2>
            <div className="flex rounded-full bg-secondary p-1 text-xs">
              {(["district", "upazila"] as const).map((k) => (
                <button key={k} onClick={() => setMode(k)} className={`rounded-full px-3 py-1 ${mode === k ? "bg-primary text-primary-foreground" : ""}`}>{k === "district" ? "জেলা" : "উপজেলা"}</button>
              ))}
            </div>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">গত ২৪ ঘণ্টায় রিপোর্ট করা মোট চাঁদা অনুযায়ী</p>
          {ranked.length === 0 && <p className="text-sm text-muted-foreground">গত ২৪ ঘণ্টায় কোনো রিপোর্ট নেই</p>}
          <ol className="space-y-3">
            {ranked.map(([name, v], i) => (
              <li key={name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold"><span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${i === 0 ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>{bn(i + 1)}</span>{name}</span>
                  <span className="font-bold text-accent">৳{bn(v.amount)} <span className="text-xs font-normal text-muted-foreground">({bn(v.count)}টি)</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(v.amount / max) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col rounded-2xl bg-primary p-6 text-primary-foreground lg:col-span-2">
          <h3 className="font-display text-2xl">চাঁদার জেলাভিত্তিক খতিয়ান</h3>
          <div className="mt-4 grid grid-cols-2 gap-2 text-foreground">
            <select className={sel} value={div} onChange={(e) => { setDiv(e.target.value); setDist(""); }}>
              <option value="">সব বিভাগ</option>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select className={sel} value={dist} disabled={!div} onChange={(e) => setDist(e.target.value)}>
              <option value="">সব জেলা</option>{div && Object.keys(LOCATIONS[div]).map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="mt-6 flex-1 space-y-4">
            <div><p className="text-sm opacity-80">মোট রিপোর্টকৃত চাঁদা</p><p className="text-4xl font-bold">৳{bn(total)}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-on-flag/10 p-3"><p className="text-xs opacity-80">মোট রিপোর্ট</p><p className="text-2xl font-bold">{bn(filtered.length)}</p></div>
              <div className="rounded-xl bg-accent p-3 text-accent-foreground"><p className="text-xs opacity-90">সত্যতা পাওয়া</p><p className="text-2xl font-bold">{bn(verified)}</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
