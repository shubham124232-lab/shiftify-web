"use client";

// /blocked-users — reached via Help & Safety ("Block or limit contact"), not
// top-level nav. Lists everyone the current user has blocked (GET /users/blocks)
// with an Unblock action per row (DELETE /users/blocks/:blockedUserId).

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BlockedUser {
  id: string;
  blockedUserId: string;
  blockMessages: boolean;
  hideProfile: boolean;
  reportReason: string | null;
  createdAt: string;
  blocked: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export default function BlockedUsersPage() {
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.get<{ blocks: BlockedUser[] }>("/users/blocks")
      .then(r => setBlocks(r.blocks ?? []))
      .catch(e => setError(e instanceof ApiError ? e.message : "Could not load blocked users."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleUnblock(item: BlockedUser) {
    if (!confirm(`Unblock ${item.blocked.name}? They'll be able to message you and view your profile again.`)) return;
    setUnblockingId(item.id);
    setError(null);
    try {
      await api.delete(`/users/blocks/${item.blockedUserId}`);
      setBlocks(prev => prev.filter(b => b.id !== item.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not unblock this user.");
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Blocked users"
        description="People you've blocked from messaging you or viewing your profile."
      />
      <div className="mx-auto max-w-3xl px-5 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-700">No blocked users</p>
            <p className="text-sm text-slate-400 mt-1">
              You can block someone from a job&apos;s Messages panel, or while flagging an
              incident. See{" "}
              <Link href="/help-safety" className="text-brand-600 hover:underline">
                Help &amp; Safety
              </Link>{" "}
              for details.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map(item => (
              <Card key={item.id}>
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.blocked.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.blocked.avatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500 shrink-0">
                          {item.blocked.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{item.blocked.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Blocked {new Date(item.createdAt).toLocaleDateString("en-AU")}
                        </p>
                        {item.reportReason && (
                          <p className="text-xs text-slate-500 mt-1 italic truncate">&ldquo;{item.reportReason}&rdquo;</p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unblockingId === item.id}
                      onClick={() => handleUnblock(item)}
                      className="shrink-0"
                    >
                      {unblockingId === item.id ? "..." : "Unblock"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
