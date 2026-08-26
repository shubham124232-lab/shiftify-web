"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LIST_TYPES = [
  "GENERAL",
  "PREFERRED_WORKER",
  "PREFERRED_PROVIDER",
  "BACKUP",
  "RAPID_RESPONSE",
  "PARTICIPANT_FAVOURITE",
  "DO_NOT_INVITE",
] as const;
type ListType = (typeof LIST_TYPES)[number];

const LIST_TYPE_LABELS: Record<ListType, string> = {
  GENERAL: "General",
  PREFERRED_WORKER: "Preferred worker",
  PREFERRED_PROVIDER: "Preferred provider",
  BACKUP: "Backup",
  RAPID_RESPONSE: "Rapid response",
  PARTICIPANT_FAVOURITE: "Participant favourite",
  DO_NOT_INVITE: "Do not invite",
};

interface SavedProfessional {
  id: string;
  professionalUserId: string;
  note: string | null;
  listType: ListType;
  forParticipantUserId: string | null;
  createdAt: string;
  professional: {
    id: string;
    name: string;
    avatarUrl: string | null;
    roles: { role: string }[];
    workerProfile: {
      rating: number; totalReviews: number; hourlyRate: number | null;
      servicesOffered: string[] | null; suburb: string | null; state: string | null;
    } | null;
    providerProfile: {
      averageRating: number; totalRatings: number;
      coreServices: string[] | null; businessName: string | null;
    } | null;
  };
}

export default function SavedProfessionalsPage() {
  const [saved, setSaved] = useState<SavedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ListType | "ALL">("ALL");

  function load() {
    setLoading(true);
    api.get<{ saved: SavedProfessional[] }>("/saved-professionals")
      .then(r => setSaved(r.saved ?? []))
      .catch(e => setError(e instanceof ApiError ? e.message : "Could not load saved professionals"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function remove(item: SavedProfessional) {
    setRemovingId(item.id);
    try {
      const params = new URLSearchParams({ listType: item.listType });
      if (item.forParticipantUserId) params.set("forParticipantUserId", item.forParticipantUserId);
      await api.delete(`/saved-professionals/${item.professionalUserId}?${params.toString()}`);
      setSaved(s => s.filter(row => row.id !== item.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not remove.");
    } finally {
      setRemovingId(null);
    }
  }

  async function addToList(professionalUserId: string, listType: ListType) {
    setAddingId(professionalUserId);
    try {
      await api.post("/saved-professionals", { professionalUserId, listType });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add to that list.");
    } finally {
      setAddingId(null);
    }
  }

  const visible = activeFilter === "ALL" ? saved : saved.filter(item => item.listType === activeFilter);
  const presentTypes = LIST_TYPES.filter(t => saved.some(item => item.listType === t));

  return (
    <>
      <PageHeader
        title="Saved Professionals"
        description="Workers and providers you've bookmarked for later."
      />
      <div className="mx-auto max-w-3xl px-5 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && saved.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === "ALL" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({saved.length})
            </button>
            {presentTypes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeFilter === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {LIST_TYPE_LABELS[t]} ({saved.filter(item => item.listType === t).length})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No saved professionals yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Save workers from <Link href="/workers/available" className="text-brand-600 hover:underline">Browse Workers</Link> to build your shortlist.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400">No professionals in this list yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(item => {
              const isWorker = item.professional.roles.some(r => r.role === "SUPPORT_WORKER");
              const wp = item.professional.workerProfile;
              const pp = item.professional.providerProfile;
              const rate = wp?.hourlyRate != null ? `$${wp.hourlyRate}/hr` : null;
              const rating = isWorker ? wp?.rating : pp?.averageRating;
              const totalReviews = isWorker ? wp?.totalReviews : pp?.totalRatings;
              const services = (isWorker ? wp?.servicesOffered : pp?.coreServices) ?? [];

              return (
                <Card key={item.id}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base font-semibold text-slate-900">
                            {pp?.businessName ?? item.professional.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {isWorker ? "Support Worker" : "Provider"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                            {LIST_TYPE_LABELS[item.listType]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mb-2">
                          {wp?.suburb && <span>{wp.suburb}, {wp.state}</span>}
                          {!!totalReviews && totalReviews > 0 && (
                            <span>★ {rating?.toFixed(1)} ({totalReviews})</span>
                          )}
                          {rate && <span className="font-semibold text-emerald-700">{rate}</span>}
                        </div>
                        {services.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {services.slice(0, 4).map(s => (
                              <span key={s} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">{s}</span>
                            ))}
                          </div>
                        )}
                        {item.note && (
                          <p className="text-xs text-slate-500 mt-2 italic">&ldquo;{item.note}&rdquo;</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <select
                          className="h-7 px-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                          disabled={addingId === item.professionalUserId}
                          value=""
                          onChange={e => {
                            const value = e.target.value as ListType;
                            if (value) addToList(item.professionalUserId, value);
                          }}
                        >
                          <option value="">+ Add to list…</option>
                          {LIST_TYPES.filter(t => !saved.some(s => s.professionalUserId === item.professionalUserId && s.listType === t)).map(t => (
                            <option key={t} value={t}>{LIST_TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                        <Button
                          size="sm" variant="ghost"
                          disabled={removingId === item.id}
                          onClick={() => remove(item)}
                        >
                          {removingId === item.id ? "..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
