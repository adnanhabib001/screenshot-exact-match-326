import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Report = Tables<"reports">;

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (active && data) setReports(data);
        setLoading(false);
      });

    const channel = supabase
      .channel("reports-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, (payload) => {
        setReports((prev) => {
          if (payload.eventType === "INSERT") {
            const r = payload.new as Report;
            return prev.some((p) => p.id === r.id) ? prev : [r, ...prev];
          }
          if (payload.eventType === "UPDATE") {
            const r = payload.new as Report;
            return prev.map((p) => (p.id === r.id ? r : p));
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((p) => p.id !== (payload.old as Report).id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { reports, loading };
}
