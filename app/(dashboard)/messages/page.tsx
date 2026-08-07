"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { api } from "@/lib/api";

interface JobSummary {
  id: string;
  title: string;
  status?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

interface Thread {
  job: JobSummary;
  lastMessage: Message | null;
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { jobs } = await api.get<{ jobs: JobSummary[] }>("/jobs/my");
        const withMessages = await Promise.all(
          jobs.map(async (job) => {
            const { messages } = await api.get<{ messages: Message[] }>(`/jobs/${job.id}/messages`);
            return { job, lastMessage: messages.length ? messages[messages.length - 1] : null };
          })
        );
        if (cancelled) return;
        const sorted = withMessages.sort((a, b) => {
          const at = a.lastMessage?.createdAt ?? "";
          const bt = b.lastMessage?.createdAt ?? "";
          return bt.localeCompare(at);
        });
        setThreads(sorted);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader title="Messages" description="Per-job conversation threads." />
      <div className="container-page py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon="💬"
                title="No active conversations"
                description="Each job gets its own thread once someone applies or accepts."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {threads.map(({ job, lastMessage }) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-brand-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {lastMessage ? `${lastMessage.senderName}: ${lastMessage.body}` : "No messages yet"}
                    </p>
                  </div>
                  {lastMessage && (
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
