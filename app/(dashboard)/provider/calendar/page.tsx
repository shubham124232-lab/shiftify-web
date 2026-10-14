"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequestDetailDialog } from "@/components/provider/RequestDialogs";

interface Row { id: string; title: string; suburb: string; status: string; urgency?: string; branchId?: string | null; scheduledStartAt: string; scheduledEndAt?: string | null }
interface Branch { id: string; name: string }
type View = "day" | "week" | "month" | "list";

const LIVE = ["OPEN"];
const CONFIRMED = ["CONFIRMED", "ASSIGNED", "IN_PROGRESS"];
const URGENCY: Record<string, string> = { RAPID: "Rapid", URGENT: "Urgent", LAST_MINUTE: "Last-Minute", ROUTINE: "Routine" };

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const mondayOf = (d: Date) => { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).toLowerCase();
const dm = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const sameDay = (iso: string, d: Date) => new Date(iso).toDateString() === d.toDateString();

// Provider Calendar (doc P67): day, week, month and list views over live and confirmed support, with a Branch filter.
export default function ProviderCalendarPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("branch") ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));

  useEffect(() => {
    api.get<{ jobs: Row[] }>("/jobs/my").then((r) => setRows(r.jobs ?? []))
      .catch((e) => { setError(e instanceof Error ? e.message : "Could not load the calendar"); setRows([]); });
    api.get<{ branches: Branch[] }>("/provider-org/branches").then((r) => setBranches(r.branches ?? [])).catch(() => setBranches([]));
  }, []);

  const events = useMemo(() => (rows ?? [])
    .filter((j) => (LIVE.includes(j.status) || CONFIRMED.includes(j.status)) && (!branch || j.branchId === branch))
    .sort((a, b) => +new Date(a.scheduledStartAt) - +new Date(b.scheduledStartAt)), [rows, branch]);
  const forDay = (d: Date) => events.filter((j) => sameDay(j.scheduledStartAt, d));

  const weekStart = mondayOf(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthFirst = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthGridStart = mondayOf(monthFirst);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));

  const step = (n: number) => setAnchor((a) => view === "day" ? addDays(a, n) : view === "month" ? new Date(a.getFullYear(), a.getMonth() + n, 1) : addDays(a, n * 7));
  const label = view === "day" ? anchor.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
    : view === "month" ? anchor.toLocaleDateString("en-AU", { month: "long", year: "numeric" })
    : view === "list" ? "All live and confirmed support"
    : `${dm(weekDays[0])} – ${dm(weekDays[6])} ${weekDays[6].getFullYear()}`;
  const unit = view === "day" ? "day" : view === "month" ? "month" : "week";

  const chip = (j: Row, compact = false) => {
    const confirmed = CONFIRMED.includes(j.status);
    return (
      <button key={j.id} type="button" onClick={() => setOpenId(j.id)}
        className={cn("block w-full rounded-lg border-l-[3px] px-2.5 py-2 text-left text-xs", confirmed ? "border-l-emerald-500 bg-emerald-50" : "border-l-brand-500 bg-brand-50")}>
        <span className="block text-slate-500">{time(j.scheduledStartAt)}{j.scheduledEndAt ? `–${time(j.scheduledEndAt)}` : ""}</span>
        <span className="block font-semibold text-slate-900">{j.title}</span>
        {!compact && <span className="block text-slate-500">{confirmed ? "Confirmed" : "Live"} · {j.suburb}{j.urgency ? ` · ${URGENCY[j.urgency] ?? j.urgency}` : ""}</span>}
      </button>
    );
  };

  return (
    <>
      <PageHeader title="Calendar" description={`${label} · ${view === "list" ? "List view" : `${view[0].toUpperCase()}${view.slice(1)} view`}`}
        actions={view === "list" ? undefined : <>
          <Button variant="outline" size="sm" onClick={() => step(-1)}><ChevronLeft className="mr-1 h-4 w-4" />Previous {unit}</Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(startOfDay(new Date()))}>{view === "day" ? "Today" : view === "month" ? "This month" : "This week"}</Button>
          <Button variant="outline" size="sm" onClick={() => step(1)}>Next {unit}<ChevronRight className="ml-1 h-4 w-4" /></Button>
        </>} />
      <div className="container-page space-y-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-semibold">
            {(["day", "week", "month", "list"] as View[]).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={cn("px-4 py-2 capitalize", view === v ? "bg-slate-900 text-white" : "text-slate-500")}>{v}</button>
            ))}
          </div>
          {branches.length > 0 && (
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {rows === null ? <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> : (
          <>
            {view === "week" && (
              <div className="grid gap-3 md:grid-cols-7">
                {weekDays.map((d) => {
                  const todays = forDay(d);
                  return (
                    <Card key={d.toISOString()}>
                      <CardContent className="space-y-2 p-3">
                        <p className="m-0 text-sm font-bold text-slate-900">{d.toLocaleDateString("en-AU", { weekday: "short" })} <span className="text-slate-500">{d.getDate()}</span></p>
                        {todays.length === 0 ? <p className="m-0 text-xs text-slate-400">No scheduled support</p> : todays.map((j) => chip(j))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {view === "day" && (
              <Card><CardContent className="space-y-2 p-4">
                {forDay(anchor).length === 0 ? <p className="m-0 py-6 text-center text-sm text-slate-500">No scheduled support</p> : forDay(anchor).map((j) => chip(j))}
              </CardContent></Card>
            )}

            {view === "month" && (
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((n) => <p key={n} className="m-0 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-500">{n}</p>)}
                {monthDays.map((d) => {
                  const todays = forDay(d);
                  return (
                    <div key={d.toISOString()} className={cn("min-h-[92px] space-y-1 bg-white p-1.5", d.getMonth() !== anchor.getMonth() && "bg-slate-50 opacity-60")}>
                      <p className="m-0 text-xs font-semibold text-slate-500">{d.getDate()}</p>
                      {todays.slice(0, 2).map((j) => chip(j, true))}
                      {todays.length > 2 && <button type="button" onClick={() => { setAnchor(d); setView("day"); }} className="text-[11px] font-semibold text-brand-600">+{todays.length - 2} more</button>}
                    </div>
                  );
                })}
              </div>
            )}

            {view === "list" && (
              <Card><CardContent className="p-0">
                {events.length === 0 ? <p className="m-0 px-5 py-8 text-center text-sm text-slate-500">No scheduled support</p> : events.map((j) => (
                  <button key={j.id} type="button" onClick={() => setOpenId(j.id)} className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3 text-left last:border-0 hover:bg-slate-50">
                    <span><span className="block text-sm font-semibold text-slate-900">{j.title}</span>
                      <span className="block text-xs text-slate-500">{new Date(j.scheduledStartAt).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })} · {time(j.scheduledStartAt)}{j.scheduledEndAt ? `–${time(j.scheduledEndAt)}` : ""} · {j.suburb}{j.urgency ? ` · ${URGENCY[j.urgency] ?? j.urgency}` : ""}</span></span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", CONFIRMED.includes(j.status) ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700")}>{CONFIRMED.includes(j.status) ? "Confirmed" : "Live"}</span>
                  </button>
                ))}
              </CardContent></Card>
            )}
          </>
        )}
        <p className="m-0 text-sm text-slate-500">Open an event to see the support or assignment record. Provider branch scope is retained.</p>
      </div>
      {openId && <RequestDetailDialog jobId={openId} own onClose={() => setOpenId(null)} />}
    </>
  );
}
