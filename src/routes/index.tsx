import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Moon, Sun, TrendingUp, MapPin, BadgeCheck } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { AudioWidget } from "@/components/AudioWidget";
import { ReportForm } from "@/components/ReportForm";
import { Feed } from "@/components/Feed";
import { Leaderboard } from "@/components/Leaderboard";
import { bn } from "@/lib/bd-locations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "চাঁদা বাবা — বেনামী চাঁদাবাজি রিপোর্টিং প্ল্যাটফর্ম" },
      { name: "description", content: "স্বচ্ছ বাংলাদেশ গড়ি — বেনামে চাঁদা ও তোলাবাজির রিপোর্ট করুন, জেলাভিত্তিক হিসাব দেখুন।" },
      { property: "og:title", content: "চাঁদা বাবা — Chanda Baba" },
      { property: "og:description", content: "বাংলাদেশের জন্য বেনামী, জনগণের অংশগ্রহণে চাঁদাবাজি রিপোর্টিং প্ল্যাটফর্ম।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { reports } = useReports();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(localStorage.getItem("cb-dark") === "1");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cb-dark", dark ? "1" : "0");
  }, [dark]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const t = reports.filter((r) => new Date(r.created_at) >= today);
    const total = t.reduce((s, r) => s + Number(r.amount), 0);
    const byD = new Map<string, number>();
    t.forEach((r) => byD.set(r.district, (byD.get(r.district) ?? 0) + Number(r.amount)));
    const top = [...byD.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    const verified = reports.filter((r) => r.upvotes > r.downvotes && r.upvotes >= 5).length;
    return { total, top, verified };
  }, [reports]);

  const items = [
    { icon: TrendingUp, label: "আজকের মোট চাঁদা", value: `৳${bn(stats.total)}` },
    { icon: MapPin, label: "আজকের শীর্ষে থাকা জেলা", value: stats.top },
    { icon: BadgeCheck, label: "সত্যতা পাওয়া রিপোর্ট", value: bn(stats.verified) },
  ];

  return (
    <main>
      <AudioWidget />
      <header className="hero-bg relative overflow-hidden text-on-flag">
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center gap-3 px-4 pt-5 pr-[22rem] max-sm:pr-4 max-sm:pt-20">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-flag-red font-display text-lg">চা</div>
          <span className="font-display text-xl">চাঁদা বাবা</span>
          <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode" className="ml-auto rounded-full bg-on-flag/15 p-2">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
        <div className="flag-disc pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] -translate-y-1/2 md:right-[8%]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 md:pt-28">
          <p className="mb-4 inline-block rounded-full border border-on-flag/30 px-3 py-1 text-xs tracking-wide">নাগরিক স্বচ্ছতা প্ল্যাটফর্ম · Chanda Baba</p>
          <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
            স্বচ্ছ বাংলাদেশ গড়ি — <span className="text-flag-red [text-shadow:0_0_24px_color-mix(in_oklab,var(--flag-red)_40%,transparent)]">চাঁদা ও তোলাবাজির</span> হিসাব রাখি
          </h1>
          <p className="mt-5 max-w-xl text-on-flag/80">কোনো নাম নেই, কোনো লগইন নেই। আপনার এলাকার চাঁদাবাজির তথ্য দিন — জনগণ যাচাই করবে।</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#report" className="rounded-full bg-flag-red px-6 py-3 font-semibold shadow-lg transition hover:brightness-110">রিপোর্ট জমা দিন (বেনামে)</a>
            <a href="#stats" className="rounded-full border border-on-flag/40 px-6 py-3 font-semibold transition hover:bg-on-flag/10">এলাকাভিত্তিক হিসাব দেখুন</a>
          </div>
        </div>
        <div className="relative overflow-hidden border-t border-on-flag/15 bg-flag-red py-3">
          <div className="ticker flex w-max gap-12 whitespace-nowrap">
            {[...items, ...items, ...items, ...items].map((it, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 animate-pulse rounded-full bg-on-flag" />
                <it.icon className="h-4 w-4" />{it.label}: <span className="text-base">{it.value}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <Feed reports={reports} />
      <Leaderboard reports={reports} />
      <ReportForm />

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        চাঁদা বাবা · সকল রিপোর্ট নাগরিকদের দেওয়া অযাচাইকৃত তথ্য। জরুরি প্রয়োজনে ৯৯৯-এ কল করুন।
      </footer>
    </main>
  );
}
