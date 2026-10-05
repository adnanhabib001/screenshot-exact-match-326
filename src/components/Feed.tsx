import { useEffect, useMemo, useState } from "react";
import { ThumbsDown, ThumbsUp, MessageCircle, MapPin, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Report } from "@/hooks/useReports";
import { bn } from "@/lib/bd-locations";

type Comment = Tables<"comments">;
type Sort = "latest" | "votes" | "amount";

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${bn(m)} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${bn(h)} ঘণ্টা আগে`;
  return `${bn(Math.floor(h / 24))} দিন আগে`;
}

function ReportCard({ r }: { r: Report }) {
  const [img, setImg] = useState<string | null>(null);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    setVote((localStorage.getItem(`vote-${r.id}`) as "up" | "down" | null) ?? null);
    if (r.image_url) supabase.storage.from("proofs").createSignedUrl(r.image_url, 3600).then(({ data }) => setImg(data?.signedUrl ?? null));
  }, [r.id, r.image_url]);

  useEffect(() => {
    if (!open) return;
    supabase.from("comments").select("*").eq("report_id", r.id).order("created_at").then(({ data }) => data && setComments(data));
    const ch = supabase.channel(`comments-${r.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `report_id=eq.${r.id}` }, (p) =>
        setComments((prev) => (prev.some((c) => c.id === (p.new as Comment).id) ? prev : [...prev, p.new as Comment])))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, r.id]);

  const doVote = async (dir: "up" | "down") => {
    if (vote === dir) {
      await supabase.rpc("vote_report", { _report_id: r.id, _up: dir === "up", _delta: -1 });
      localStorage.removeItem(`vote-${r.id}`); setVote(null); return;
    }
    if (vote) await supabase.rpc("vote_report", { _report_id: r.id, _up: vote === "up", _delta: -1 });
    await supabase.rpc("vote_report", { _report_id: r.id, _up: dir === "up", _delta: 1 });
    localStorage.setItem(`vote-${r.id}`, dir); setVote(dir);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || t.length > 1000) return;
    setText("");
    await supabase.from("comments").insert({ report_id: r.id, comment_text: t });
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      {img && <img src={img} alt="প্রমাণ" className="h-44 w-full object-cover" />}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-primary-foreground"><MapPin className="h-3 w-3" />{r.district} › {r.upazila}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{r.category}</span>
          <span className="ml-auto text-muted-foreground">{timeAgo(r.created_at)}</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold leading-tight">{r.extortionist_name}</h3>
            {r.organization && <p className="text-xs text-muted-foreground">{r.organization}</p>}
            {r.landmark && <p className="mt-1 text-xs text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" />{r.landmark}</p>}
          </div>
          <span className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground">৳{bn(Number(r.amount))}</span>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">{r.tracking_id}</p>
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-sm">
          <button onClick={() => doVote("up")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${vote === "up" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}><ThumbsUp className="h-3.5 w-3.5" />সত্য {bn(r.upvotes)}</button>
          <button onClick={() => doVote("down")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${vote === "down" ? "bg-accent text-accent-foreground" : "bg-secondary"}`}><ThumbsDown className="h-3.5 w-3.5" />ভুয়া {bn(r.downvotes)}</button>
          <button onClick={() => setOpen(!open)} className="ml-auto inline-flex items-center gap-1 text-muted-foreground"><MessageCircle className="h-4 w-4" />মন্তব্য</button>
        </div>
        {open && (
          <div className="space-y-2">
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {comments.length === 0 && <li className="text-xs text-muted-foreground">এখনো কোনো মন্তব্য নেই</li>}
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-muted p-2 text-sm"><span className="font-semibold">বেনামী:</span> {c.comment_text}<div className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</div></li>
              ))}
            </ul>
            <form onSubmit={send} className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="নিশ্চিত/অস্বীকার বা তথ্য যোগ করুন..." className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <button className="rounded-lg bg-primary px-3 text-primary-foreground" aria-label="Send"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}

export function Feed({ reports }: { reports: Report[] }) {
  const [sort, setSort] = useState<Sort>("latest");
  const sorted = useMemo(() => {
    const a = [...reports];
    if (sort === "votes") a.sort((x, y) => y.upvotes - y.downvotes - (x.upvotes - x.downvotes));
    else if (sort === "amount") a.sort((x, y) => Number(y.amount) - Number(x.amount));
    else a.sort((x, y) => +new Date(y.created_at) - +new Date(x.created_at));
    return a;
  }, [reports, sort]);

  const tabs: [Sort, string][] = [["latest", "সর্বশেষ"], ["votes", "সর্বাধিক ভোট"], ["amount", "সর্বোচ্চ পরিমাণ"]];
  return (
    <section id="feed" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-3xl md:text-4xl">পাবলিক ফিড ও সত্যতা যাচাই</h2>
        <div className="flex rounded-full bg-secondary p-1 text-sm">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} className={`rounded-full px-4 py-1.5 ${sort === k ? "bg-primary text-primary-foreground" : ""}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((r) => <ReportCard key={r.id} r={r} />)}
      </div>
    </section>
  );
}
