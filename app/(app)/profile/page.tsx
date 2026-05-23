"use client";

import { useState } from "react";
import { useAuth, type UpdateProfilePayload } from "@/lib/auth-context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants/roles";

const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState<"contact" | "location" | "address" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const addr = user.address;

  async function save(payload: UpdateProfilePayload) {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(payload);
      setEditing(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Contact edit form ─────────────────────────────────────────────────────
  function ContactForm() {
    const [name, setName] = useState(user!.name);
    const [email, setEmail] = useState(user!.email ?? "");
    const [phone, setPhone] = useState(user!.phone ?? "");
    const [username, setUsername] = useState(user!.username ?? "");
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
        {error && <p className="text-sm text-emergency-600">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" loading={saving} onClick={() => save({ name, email: email || undefined, phone: phone || undefined, username: username || undefined })}>
            Save changes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setError(null); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  // ── Location edit form ────────────────────────────────────────────────────
  function LocationForm() {
    const [suburb, setSuburb] = useState(user!.defaultSuburb ?? "");
    const [state, setState] = useState(user!.defaultState ?? "");
    const [postcode, setPostcode] = useState(user!.defaultPostcode ?? "");
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Suburb" htmlFor="suburb">
            <Input id="suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
          </Field>
          <Field label="State" htmlFor="state">
            <select
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Select…</option>
              {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Postcode" htmlFor="postcode">
            <Input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          </Field>
        </div>
        {error && <p className="text-sm text-emergency-600">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" loading={saving} onClick={() => save({ defaultSuburb: suburb || undefined, defaultState: state || undefined, defaultPostcode: postcode || undefined })}>
            Save changes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setError(null); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  // ── Address edit form ─────────────────────────────────────────────────────
  function AddressForm() {
    const [unit, setUnit] = useState(addr?.unitApartment ?? "");
    const [street, setStreet] = useState(addr?.street ?? "");
    const [suburb, setSuburb] = useState(addr?.suburb ?? "");
    const [state, setState] = useState(addr?.state ?? "");
    const [postcode, setPostcode] = useState(addr?.postcode ?? "");
    const [notes, setNotes] = useState(addr?.notes ?? "");
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Unit / Apt" htmlFor="unit">
            <Input id="unit" placeholder="Optional" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
          <Field label="Street" htmlFor="street" className="sm:col-span-2">
            <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Suburb" htmlFor="asuburb">
            <Input id="asuburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
          </Field>
          <Field label="State" htmlFor="astate">
            <select
              id="astate"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Select…</option>
              {AU_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Postcode" htmlFor="apostcode">
            <Input id="apostcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          </Field>
        </div>
        <Field label="Notes (optional)" htmlFor="notes">
          <Input id="notes" placeholder="Access instructions, parking, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-emergency-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            loading={saving}
            onClick={() => save({ address: { unitApartment: unit || null, street, suburb, state, postcode, notes: notes || null } })}
          >
            Save address
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(null); setError(null); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="My Profile" description="Your account and contact details." />
      <div className="container-page py-8 space-y-6">

        {/* Account (read-only — status / roles set by admin) */}
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
                <dd>
                  <Badge tone={user.status === "APPROVED" ? "emerald" : user.status === "PENDING" ? "amber" : "rose"}>
                    {user.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Account type</dt>
                <dd className="font-medium text-slate-900">{user.accountType}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email verified</dt>
                <dd>{user.emailVerified ? <Badge tone="emerald">Verified</Badge> : <Badge tone="amber">Pending</Badge>}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone verified</dt>
                <dd>{user.phoneVerified ? <Badge tone="emerald">Verified</Badge> : <Badge tone="amber">Pending</Badge>}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Member since</dt>
                <dd className="font-medium text-slate-900">{new Date(user.createdAt).toLocaleDateString()}</dd>
              </div>
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
              {editing !== "contact" && (
                <Button size="sm" variant="outline" onClick={() => { setEditing("contact"); setError(null); }}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {editing === "contact" ? (
              <ContactForm />
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Full name</dt>
                  <dd className="font-medium text-slate-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium text-slate-900">{user.email ?? <span className="italic text-slate-400">Not set</span>}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-900">{user.phone ?? <span className="italic text-slate-400">Not set</span>}</dd>
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

        {/* Default location — editable */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Default location</CardTitle>
                <CardDescription>Used for job matching and marketplace searches.</CardDescription>
              </div>
              {editing !== "location" && (
                <Button size="sm" variant="outline" onClick={() => { setEditing("location"); setError(null); }}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-sm">
            {editing === "location" ? (
              <LocationForm />
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Suburb</dt>
                  <dd className="font-medium text-slate-900">{user.defaultSuburb ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">State</dt>
                  <dd className="font-medium text-slate-900">{user.defaultState ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Postcode</dt>
                  <dd className="font-medium text-slate-900">{user.defaultPostcode ?? "—"}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Address — editable */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Address</CardTitle>
                <CardDescription>Your primary address on file.</CardDescription>
              </div>
              {editing !== "address" && (
                <Button size="sm" variant="outline" onClick={() => { setEditing("address"); setError(null); }}>
                  {addr ? "Edit" : "Add address"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editing === "address" ? (
              <AddressForm />
            ) : !addr ? (
              <p className="text-sm text-slate-500">No address saved yet.</p>
            ) : (
              <address className="not-italic text-sm text-slate-700">
                {addr.unitApartment ? <>{addr.unitApartment}/{addr.street}</> : addr.street}<br />
                {addr.suburb} {addr.state} {addr.postcode}
                {addr.notes && <p className="mt-1 text-xs text-slate-500">{addr.notes}</p>}
              </address>
            )}
          </CardContent>
        </Card>

      </div>
    </>
  );
}
