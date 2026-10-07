"use client";

// Provider PR-LV04 / worker confirmation: download a calendar event with a reminder one hour before the start.
// The event deliberately carries no address, participant name or contact details.

import { Button } from "@/components/ui/button";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function AddToCalendarButton({ id, title, start, end, suburb }: { id: string; title: string; start: string; end: string | null; suburb?: string | null }) {
  function download() {
    const finish = end ?? new Date(new Date(start).getTime() + 2 * 3600000).toISOString();
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Shiftify//Support shift//EN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", `UID:${id}@shiftify`, `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(start)}`, `DTEND:${stamp(finish)}`,
      `SUMMARY:${esc(`Shiftify: ${title}`)}`,
      ...(suburb ? [`LOCATION:${esc(suburb)}`] : []),
      "DESCRIPTION:Open the request in Shiftify for confirmed details.",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Shift starts in 1 hour", "TRIGGER:-PT1H", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "shiftify-shift.ics"; a.click();
    URL.revokeObjectURL(url);
  }
  return <Button size="sm" variant="outline" onClick={download}>Add to calendar (1 hour reminder)</Button>;
}
