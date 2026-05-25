"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { UserStatus } from "@/lib/types";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  // ── Contact edit form ─────────────────────────────────────────────────────
  function ContactForm() {
    const [name, setName] = useState(user!.name);
    const [email, setEmail] = useState(user!.email ?? "");
    const [phone, setPhone] = useState(user!.phone ?? "");
    const [username, setUsername] = useState(user!.username ?? "");

    async function handleSave() {
      setSaving(true);
      setError(null);
      try {
        updateProfile({ name, email: email || null, phone: phone || null, username: username || null });
        setEditing(false);
      } catch {
        setError("Save failed. Please try again.");
      } finally {
        setSaving(false);
      }
    }

    return (
      <div className="space-y-4">
        <Field label="Full name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input id="phone" type="tel" placeholder="+61 4xx xxx xxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
        </div>
        <Field label="Username" htmlFor="username">
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setError(null); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  function statusTone(s: UserStatus): "emerald" | "amber" | "rose" | "slate" {
    if (s === UserStatus.ACTIVE)    return "emerald";
    if (s === UserStatus.PENDING)   return "amber";
    if (s === UserStatus.SUSPENDED) return "rose";
    return "slate";
  }

  return (
    <>
      <PageHeader title="My Profile" description="Your account and contact details." />
      <div className="container-page py-8 space-y-6">

        {/* Account — read-only */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Identity and status — managed by Shiftify.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Active role</dt>
                <dd><Badge tone="brand">{ROLE_LABELS[user.activeRole]}</Badge></dd>
              </div>
              {user.roles.length > 1 && (
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">All roles</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {user.roles.map((r) => (
                      <Badge key={r} tone="slate">{ROLE_LABELS[r]}</Badge>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd><Badge tone={statusTone(user.status)}>{user.status}</Badge></dd>
              </div>
              <div>
                <dt className="text-slate-500">Account type</dt>
                <dd className="font-medium text-slate-900">{user.accountType}</dd>
              </div>
              {user.createdAt && (
                <div>
                  <dt className="text-slate-500">Member since</dt>
                  <dd className="font-medium text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Contact — editable */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contact details</CardTitle>
                <CardDescription>Your name, email, phone, and username.</CardDescription>
              </div>
              {!editing && (
                <Button size="sm" variant="outline" onClick={() => { setEditing(true); setError(null); }}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {editing ? (
              <ContactForm />
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Full name</dt>
                  <dd className="font-medium text-slate-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">
                    {user.email ?? <span className="italic text-slate-400">Not set</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-900">
                    {user.phone ?? <span className="italic text-slate-400">Not set</span>}
                  </dd>
                </div>
                {user.username && (
                  <div>
                    <dt className="text-slate-500">Username</dt>
                    <dd className="font-medium text-slate-900">{user.username}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Location — Phase 1B placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Default location</CardTitle>
            <CardDescription>Used for job matching. Editable in Phase 1B.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            Location fields (suburb, state, postcode) arrive in the Phase 1B registration wizard.
          </CardContent>
        </Card>

      </div>
    </>
  );
}
