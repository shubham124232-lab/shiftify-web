"use client";

// /help-safety — static Help & Safety hub (Support Worker / Support Coordinator
// sidebar destination: "Help, concern reporting, incident pathway and blocking").
// No backend calls — this page links out to the real incident-report and
// block-user actions that already live on the job detail page.

import Link from "next/link";
import {
  PhoneCall, Flag, Ban, ShieldCheck, MessageSquare, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SAFETY_TIPS = [
  "Shiftify charges only for optional Power Ups. Invoicing and payment for support are arranged directly between you and the other party — Shiftify takes 0% commission and does not verify delivery or process support payments.",
  "Check a worker's or participant's documents and reviews before confirming a shift.",
  "Share exact home addresses only after both sides have mutually confirmed the shift.",
  "For a first shift with someone new, consider a short introductory call before the visit.",
  "Trust your instincts — if something feels wrong during a shift, you can end it early and report it afterwards.",
  "Keep your own emergency contacts and any relevant support plan details handy during shifts.",
];

export default function HelpSafetyPage() {
  return (
    <>
      <PageHeader
        title="Help & Safety"
        description="Emergency guidance, reporting a concern, blocking a user, and general safety tips."
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
        {/* Emergency guidance */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex gap-4 py-5">
            <PhoneCall className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                In an emergency, call 000 immediately.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-red-700">
                Shiftify is not an emergency service and cannot dispatch help. If anyone is in
                immediate danger or needs urgent medical attention, call{" "}
                <strong>000</strong> now — don&apos;t wait to submit a report or a message on
                the platform first. Reporting the incident here can come afterwards.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report a concern / incident */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Flag className="h-4 w-4 text-brand-600" />
            <CardTitle>Report a concern or incident</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-slate-600">
            <p>
              If something went wrong on a shift — a no-show, unsafe conditions, inappropriate
              behaviour, or anything you think Shiftify should know about — report it from that
              job&apos;s page.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Open the job from <span className="font-medium text-slate-800">My Jobs</span> / <span className="font-medium text-slate-800">My Requests</span>.</li>
              <li>Scroll to <span className="font-medium text-slate-800">Report an issue</span> and select <span className="font-medium text-slate-800">🚩 Flag an incident</span>.</li>
              <li>Choose a category, add a description, and submit — an admin is notified right away.</li>
            </ol>
            <p className="text-slate-500">
              You can also flag a review as inappropriate directly from a profile, and optionally
              block the other party at the same time as submitting an incident report.
            </p>
            <Link
              href="/jobs/my"
              className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Go to my jobs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        {/* Blocking */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Ban className="h-4 w-4 text-brand-600" />
            <CardTitle>Block or limit contact with someone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-slate-600">
            <p>
              Blocking a user immediately stops them from messaging you and hides your profile
              from them. It doesn&apos;t cancel any confirmed shift automatically — cancel or
              close the job separately if needed.
            </p>
            <p>You can block someone from two places:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Next to any of their messages on a job&apos;s Messages panel — select <span className="font-medium text-slate-800">Block</span>.</li>
              <li>While flagging an incident on a job — tick <span className="font-medium text-slate-800">Also block this user</span> after submitting your report.</li>
            </ul>
            <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
              <Link
                href="/messages"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Go to messages <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/blocked-users"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View blocked users <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* General safety tips */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <CardTitle>General safety tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">
              {SAFETY_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Still need help */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-600" />
            <CardTitle>Still need help?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-slate-600">
            <p>
              For anything that isn&apos;t urgent or safety-related — billing, documents,
              account questions — message Shiftify support from your{" "}
              <Link href="/messages" className="font-semibold text-brand-600 hover:text-brand-700">
                Messages
              </Link>{" "}
              page.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
