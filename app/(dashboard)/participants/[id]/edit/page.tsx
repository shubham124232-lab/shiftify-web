"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, FormProvider } from "react-hook-form";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/types";
import { ParticipantStep01_Personal } from "@/components/registration/steps/participant/Step01_Personal";
import { ParticipantStep02_NDIS } from "@/components/registration/steps/participant/Step02_NDIS";
import { ParticipantStep03_SupportNeeds } from "@/components/registration/steps/participant/Step03_SupportNeeds";
import { ParticipantStep04_EmergencyContact } from "@/components/registration/steps/participant/Step04_EmergencyContact";
import { ParticipantStep05_Declaration } from "@/components/registration/steps/participant/Step05_Declaration";

const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 14, outline: "none", background: "#fff", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4,
};

// Same field set the self-registration wizard collects across 5 steps
// (Backend/src/validators/profile-participant.schema.ts), just gathered on
// one page here instead.
interface ParticipantFormValues {
  preferredName?: string;
  participantType?: string;
  ageGroup?: string;
  gender?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  fullAddress?: string;
  ndisNumber?: string;
  fundingManagementType?: string;
  supportCoordinationFunding?: string;
  ndisStartDate?: string;
  ndisEndDate?: string;
  primaryDisability?: string;
  primarySupportNeeds?: string[];
  mobilitySupportNeeds?: string[];
  communicationNeeds?: string[];
  behaviourSensoryNotes?: string[];
  medicalConsiderations?: string[];
  riskSafetyNotes?: string;
  skillsRequired?: string[];
  supportPreferences?: string[];
  preferredSupportType?: string;
  preferredWorkerGender?: string;
  languagePreference?: string[];
  culturalPreference?: string[];
  preferredDays?: string[];
  preferredTime?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  seekingPlanManager?: boolean;
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
  ndisCodeAccepted?: boolean;
}

export default function EditParticipantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeRole } = useAuth();

  const [name,         setName]         = useState("");
  const [username,     setUsername]     = useState("");
  const [phone,        setPhone]        = useState("");
  const [defaultSuburb, setDefaultSuburb] = useState("");

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);
  const [newPassword,  setNewPassword]  = useState("");
  const [showNewPw,    setShowNewPw]    = useState(false);
  const [resetting,    setResetting]    = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const form = useForm<ParticipantFormValues>({ defaultValues: {} });

  useEffect(() => {
    if (activeRole !== UserRole.COORDINATOR || !id) return;
    api.get<{ user: any }>(`/users/${id}`)
      .then(r => {
        const u = r.user;
        setName(u.name ?? "");
        setUsername(u.username ?? "");
        setPhone(u.phone ?? "");
        setDefaultSuburb(u.defaultSuburb ?? "");
        const pp = u.participantProfile ?? {};
        form.reset({
          preferredName: pp.preferredName ?? "",
          participantType: pp.participantType ?? "",
          ageGroup: pp.ageGroup ?? "",
          gender: pp.gender ?? "",
          suburb: pp.suburb ?? "",
          postcode: pp.postcode ?? "",
          state: pp.state ?? "",
          fullAddress: pp.fullAddress ?? "",
          ndisNumber: pp.ndisNumber ?? "",
          fundingManagementType: pp.fundingManagementType ?? "",
          supportCoordinationFunding: pp.supportCoordinationFunding ?? "",
          ndisStartDate: pp.ndisStartDate ? pp.ndisStartDate.slice(0, 10) : "",
          ndisEndDate: pp.ndisEndDate ? pp.ndisEndDate.slice(0, 10) : "",
          primaryDisability: pp.primaryDisability ?? "",
          primarySupportNeeds: pp.primarySupportNeeds ?? [],
          mobilitySupportNeeds: pp.mobilitySupportNeeds ?? [],
          communicationNeeds: pp.communicationNeeds ?? [],
          behaviourSensoryNotes: pp.behaviourSensoryNotes ?? [],
          medicalConsiderations: pp.medicalConsiderations ?? [],
          riskSafetyNotes: pp.riskSafetyNotes ?? "",
          skillsRequired: pp.skillsRequired ?? [],
          supportPreferences: pp.supportPreferences ?? [],
          preferredSupportType: pp.preferredSupportType ?? "",
          preferredWorkerGender: pp.preferredWorkerGender ?? "",
          languagePreference: pp.languagePreference ?? [],
          culturalPreference: pp.culturalPreference ?? [],
          preferredDays: pp.preferredDays ?? [],
          preferredTime: pp.preferredTime ?? [],
          emergencyContactName: pp.emergencyContactName ?? "",
          emergencyContactPhone: pp.emergencyContactPhone ?? "",
          emergencyContactRelationship: pp.emergencyContactRelationship ?? "",
          seekingPlanManager: pp.seekingPlanManager ?? false,
          termsAccepted: pp.termsAccepted ?? false,
          privacyPolicyAccepted: pp.privacyPolicyAccepted ?? false,
          ndisCodeAccepted: pp.ndisCodeAccepted ?? false,
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeRole]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      await api.patch(`/users/${id}`, {
        name:          name.trim()          || undefined,
        phone:         phone.trim()         || undefined,
        defaultSuburb: defaultSuburb.trim() || undefined,
      });
      await api.post(`/users/${id}/profile/participant`, form.getValues())
        .catch(profileErr => {
          console.warn("Profile save warning:", profileErr?.message);
          throw profileErr;
        });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? "Save failed. Check the console for details.");
    } finally {
      setSaving(false);
    }
  }

  if (activeRole !== UserRole.COORDINATOR) {
    return (
      <>
        <PageHeader title="Edit Participant" />
        <div style={{ padding: "32px 20px" }}>
          <p style={{ color: "#64748b", fontSize: 14 }}>Only coordinators can edit participant profiles.</p>
        </div>
      </>
    );
  }

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading...</div>;

  return (
    <>
      <PageHeader
        title="Edit Participant Profile"
        description="Update this participant's details on their behalf."
        actions={<Link href="/participants"><Button variant="outline" size="sm">← Back</Button></Link>}
      />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <Card>
            <CardHeader><CardTitle>Account details</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {username && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Login username</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{username}</span>
                </div>
              )}
              <div>
                <label style={lbl}>Full name</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input style={inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+61 4xx xxx xxx" />
              </div>
              <div>
                <label style={lbl}>Default suburb</label>
                <input style={inp} value={defaultSuburb} onChange={e => setDefaultSuburb(e.target.value)} placeholder="e.g. Parramatta" />
              </div>
            </CardContent>
          </Card>

          {/* Same fields the self-registration wizard collects across Steps 1-5 */}
          <FormProvider {...form}>
            <Card>
              <CardHeader><CardTitle>Personal details</CardTitle></CardHeader>
              <CardContent><ParticipantStep01_Personal /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>NDIS funding</CardTitle></CardHeader>
              <CardContent><ParticipantStep02_NDIS /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Support needs</CardTitle></CardHeader>
              <CardContent><ParticipantStep03_SupportNeeds /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Emergency contact</CardTitle></CardHeader>
              <CardContent><ParticipantStep04_EmergencyContact /></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Declarations</CardTitle></CardHeader>
              <CardContent><ParticipantStep05_Declaration /></CardContent>
            </Card>
          </FormProvider>

          {error && (
            <div style={{ background: "#FFF0F0", border: "1px solid #FFCDD2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C62828" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#E8F5E9", border: "2px solid #A5D6A7", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "#2E7D32", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>✓ Participant profile saved successfully.</span>
              <button
                type="button"
                onClick={() => router.push("/participants")}
                style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                ← Back to participants
              </button>
            </div>
          )}

          {/* Reset password */}
          <Card>
            <CardHeader><CardTitle style={{ fontSize: 15 }}>Reset login password</CardTitle></CardHeader>
            <CardContent style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ fontSize: 13, color: "#64748b" }}>Set a new password for this participant's account. Share it with them directly.</p>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  style={{ ...inp, paddingRight: 60 }}
                />
                <button type="button" onClick={() => setShowNewPw(v => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                  {showNewPw ? "Hide" : "Show"}
                </button>
              </div>
              {resetSuccess && <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Password updated successfully.</p>}
              <button
                type="button"
                disabled={resetting || newPassword.length < 8}
                onClick={async () => {
                  setResetting(true); setResetSuccess(false);
                  try {
                    await api.post(`/users/${id}/reset-password`, { password: newPassword });
                    setNewPassword(""); setResetSuccess(true);
                  } catch (err: any) { setError(err?.message ?? "Reset failed."); }
                  finally { setResetting(false); }
                }}
                style={{ alignSelf: "flex-start", height: 38, padding: "0 18px", background: newPassword.length >= 8 ? "#374151" : "#e2e8f0", color: newPassword.length >= 8 ? "#fff" : "#94a3b8", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: newPassword.length >= 8 ? "pointer" : "not-allowed" }}
              >
                {resetting ? "Resetting..." : "Reset password"}
              </button>
            </CardContent>
          </Card>

          <div style={{ display: "flex", gap: 12 }}>
            <Button type="submit" loading={saving}>Save changes</Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/participants")}>Cancel</Button>
          </div>
        </form>
      </div>
    </>
  );
}
