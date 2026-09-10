/* Premium duotone icon set for the home page.
   One consistent grammar: a 24px stroked outline plus a soft filled shape at
   low opacity, both in `currentColor`, so every icon picks up its tile accent. */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

const soft = { fill: 'currentColor', stroke: 'none', opacity: 0.16 } as const;
const softer = { fill: 'currentColor', stroke: 'none', opacity: 0.1 } as const;

/* ── Timing lanes ───────────────────────────────────────────────────────── */

export const IconRapid = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" {...softer} />
    <path d="M13.2 3.2 6.4 13.1h4.5l-.9 7.7 6.9-9.9h-4.6z" {...soft} />
    <path d="M13.2 3.2 6.4 13.1h4.5l-.9 7.7 6.9-9.9h-4.6z" />
  </Svg>
);

export const IconUrgent = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8.4" {...soft} />
    <circle cx="12" cy="13" r="8.4" />
    <path d="M12 8.4V13l3.1 1.9" />
    <path d="M9 2.6h6M4.6 5.2 6.4 3.6M19.4 5.2 17.6 3.6" />
  </Svg>
);

export const IconLastMinute = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.8" width="18" height="16" rx="3.4" {...soft} />
    <rect x="3" y="4.8" width="18" height="16" rx="3.4" />
    <path d="M3 9.6h18M8 2.8v3.6M16 2.8v3.6" />
    <circle cx="16.4" cy="15.4" r="3.4" fill="none" />
    <path d="M16.4 13.8v1.7l1.2.8" />
  </Svg>
);

export const IconRoutine = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" {...softer} />
    <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" />
    <path d="M17.9 2.9v3.6h-3.6M6.1 21.1v-3.6h3.6" />
    <circle cx="12" cy="12" r="2.6" {...soft} />
  </Svg>
);

/* ── Roles ──────────────────────────────────────────────────────────────── */

export const IconParticipant = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="7.4" r="3.6" {...soft} />
    <circle cx="12" cy="7.4" r="3.6" />
    <path d="M4.6 20.6a7.4 7.4 0 0 1 14.8 0" {...soft} />
    <path d="M4.6 20.6a7.4 7.4 0 0 1 14.8 0" />
  </Svg>
);

export const IconWorker = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="7.6" r="3.4" {...soft} />
    <circle cx="9" cy="7.6" r="3.4" />
    <path d="M2.8 20.4a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16.4 4.6a3.4 3.4 0 0 1 0 6.6M18 14.6a6.2 6.2 0 0 1 3.2 5.4" />
  </Svg>
);

export const IconCoordinator = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.2" y="3.4" width="15.6" height="17.2" rx="3.2" {...soft} />
    <rect x="4.2" y="3.4" width="15.6" height="17.2" rx="3.2" />
    <path d="M9 2.4h6a1.4 1.4 0 0 1 1.4 1.4v1H7.6v-1A1.4 1.4 0 0 1 9 2.4Z" />
    <path d="M8.4 11.4h7.2M8.4 15.2h4.6" />
  </Svg>
);

export const IconProvider = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.4 20.6V7.2l7-3.8 7 3.8v13.4" {...soft} />
    <path d="M3.4 20.6V7.2l7-3.8 7 3.8v13.4M17.4 11.2h3.2v9.4M2.2 20.6h19.6" />
    <path d="M7.6 20.6v-4.4h5.6v4.4" />
    <path d="M8 9.6h1.6M11.4 9.6H13" />
  </Svg>
);

/* ── Roles strip — simpler line / solid pictograms ─────────────────────── */

export const IconPersonLine = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <circle cx="12" cy="7.6" r="4" />
    <path d="M4.8 20.6v-.4a7.2 7.2 0 0 1 14.4 0v.4z" />
  </Svg>
);

export const IconGroupLine = (p: IconProps) => (
  <Svg strokeWidth={1.8} {...p}>
    <circle cx="12" cy="7.4" r="3.2" />
    <path d="M6.4 20.2v-.8a5.6 5.6 0 0 1 11.2 0v.8z" />
    <circle cx="5.2" cy="9.8" r="2.3" />
    <path d="M1.8 18.6v-.3a3.8 3.8 0 0 1 4.6-3.7" />
    <circle cx="18.8" cy="9.8" r="2.3" />
    <path d="M22.2 18.6v-.3a3.8 3.8 0 0 0-4.6-3.7" />
  </Svg>
);

export const IconDocumentSolid = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.6 2.4h7.6l5.6 5.6v12a1.6 1.6 0 0 1-1.6 1.6H6.6A1.6 1.6 0 0 1 5 20V4a1.6 1.6 0 0 1 1.6-1.6Z" fill="currentColor" stroke="none" />
    <path d="M14.2 2.4v4.4a1.2 1.2 0 0 0 1.2 1.2h4.4" fill="#fff" fillOpacity={0.45} stroke="none" />
    <path d="M8.6 12.4h6.8M8.6 15.4h6.8M8.6 18.4h4" stroke="#fff" />
  </Svg>
);

export const IconBuildingsSolid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="2.6" width="10.4" height="18.8" rx="1.2" fill="currentColor" stroke="none" />
    <rect x="13.2" y="8.6" width="8" height="12.8" rx="1.2" fill="currentColor" fillOpacity={0.72} stroke="none" />
    <g fill="#fff" stroke="none">
      <rect x="5.2" y="5.4" width="2" height="2" rx=".4" />
      <rect x="8.8" y="5.4" width="2" height="2" rx=".4" />
      <rect x="5.2" y="9.4" width="2" height="2" rx=".4" />
      <rect x="8.8" y="9.4" width="2" height="2" rx=".4" />
      <rect x="5.2" y="13.4" width="2" height="2" rx=".4" />
      <rect x="8.8" y="13.4" width="2" height="2" rx=".4" />
      <rect x="7" y="17.6" width="2" height="3.8" rx=".4" />
      <rect x="15.4" y="11.4" width="1.6" height="1.6" rx=".3" />
      <rect x="18.2" y="11.4" width="1.6" height="1.6" rx=".3" />
      <rect x="15.4" y="14.8" width="1.6" height="1.6" rx=".3" />
      <rect x="18.2" y="14.8" width="1.6" height="1.6" rx=".3" />
    </g>
  </Svg>
);

export const IconCalculatorSolid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.4" y="2.4" width="15.2" height="19.2" rx="2.4" fill="currentColor" stroke="none" />
    <rect x="7" y="5" width="10" height="4" rx=".8" fill="#fff" fillOpacity={0.9} stroke="none" />
    <g fill="#fff" stroke="none">
      <circle cx="8.4" cy="12.4" r="1.1" />
      <circle cx="12" cy="12.4" r="1.1" />
      <circle cx="15.6" cy="12.4" r="1.1" />
      <circle cx="8.4" cy="15.6" r="1.1" />
      <circle cx="12" cy="15.6" r="1.1" />
      <circle cx="8.4" cy="18.8" r="1.1" />
      <circle cx="12" cy="18.8" r="1.1" />
      <rect x="14.5" y="14.5" width="2.2" height="5.4" rx="1.1" />
    </g>
  </Svg>
);

/* ── Services ───────────────────────────────────────────────────────────── */

export const IconEmergency = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.6 4 6v6.2c0 4.6 3.3 8 8 9.2 4.7-1.2 8-4.6 8-9.2V6z" {...soft} />
    <path d="M12 2.6 4 6v6.2c0 4.6 3.3 8 8 9.2 4.7-1.2 8-4.6 8-9.2V6z" />
    <path d="M12 8.2v4.4M12 15.8h.01" />
  </Svg>
);

export const IconPersonalCare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.4S3.8 15.6 3.8 9.8a4.4 4.4 0 0 1 8.2-2.2 4.4 4.4 0 0 1 8.2 2.2c0 5.8-8.2 10.6-8.2 10.6Z" {...soft} />
    <path d="M12 20.4S3.8 15.6 3.8 9.8a4.4 4.4 0 0 1 8.2-2.2 4.4 4.4 0 0 1 8.2 2.2c0 5.8-8.2 10.6-8.2 10.6Z" />
  </Svg>
);

export const IconDailyLiving = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.4 10.4 12 3.4l8.6 7v9.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" {...soft} />
    <path d="M3.4 10.4 12 3.4l8.6 7v9.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" />
    <path d="m9.2 14.4 1.9 1.9 3.7-3.8" />
  </Svg>
);

export const IconCommunity = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8.4" cy="8.6" r="3.2" {...soft} />
    <circle cx="8.4" cy="8.6" r="3.2" />
    <circle cx="16.6" cy="10" r="2.4" />
    <path d="M2.6 19.8a5.8 5.8 0 0 1 11.6 0M15.4 14.6a5 5 0 0 1 6 5.2" />
  </Svg>
);

export const IconOvernight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.4 14.4A8.6 8.6 0 0 1 9.6 3.6a8.6 8.6 0 1 0 10.8 10.8Z" {...soft} />
    <path d="M20.4 14.4A8.6 8.6 0 0 1 9.6 3.6a8.6 8.6 0 1 0 10.8 10.8Z" />
    <path d="M17.4 3 18 4.8l1.8.6-1.8.6-.6 1.8-.6-1.8L15 5.4l1.8-.6z" />
  </Svg>
);

export const IconTransport = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.6 15.4V8.6A1.6 1.6 0 0 1 4.2 7h8.2v8.4z" {...soft} />
    <path d="M2.6 15.4V8.6A1.6 1.6 0 0 1 4.2 7h8.2v8.4h9V12l-2.6-4h-6.4" />
    <path d="M2.6 15.4h1.2M15.6 15.4h1.6M21.4 15.4h-.6" />
    <circle cx="6.6" cy="17.4" r="2" />
    <circle cx="18" cy="17.4" r="2" />
  </Svg>
);

export const IconDomestic = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.6 13.4 4.4 19.6a2 2 0 0 0 2.8 2.8l6.2-6.2z" {...soft} />
    <path d="M10.6 13.4 4.4 19.6a2 2 0 0 0 2.8 2.8l6.2-6.2z" />
    <path d="m13 11 4.6-4.6a2.6 2.6 0 1 1 3.4 3.4L16.4 14.4z" />
    <path d="M17.6 2.6 18.2 4.4 20 5l-1.8.6-.6 1.8L17 5.6 15.2 5l1.8-.6z" />
  </Svg>
);

export const IconNursing = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="17.4" cy="15.4" r="2.6" {...soft} />
    <path d="M6 2.8v5.4a4.2 4.2 0 0 0 8.4 0V2.8" />
    <path d="M4.4 2.8h3.2M12.8 2.8H16" />
    <path d="M10.2 12.4v2.2a4.6 4.6 0 0 0 4.6 4.6h.2" />
    <circle cx="17.4" cy="15.4" r="2.6" />
  </Svg>
);

export const IconRespite = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" {...soft} />
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.2M12 19.2v2.2M4.4 12H2.2M21.8 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5" />
  </Svg>
);

export const IconCoordination = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.2" y="3.4" width="15.6" height="17.2" rx="3.2" {...soft} />
    <rect x="4.2" y="3.4" width="15.6" height="17.2" rx="3.2" />
    <path d="M9 2.4h6a1.4 1.4 0 0 1 1.4 1.4v1H7.6v-1A1.4 1.4 0 0 1 9 2.4Z" />
    <path d="m8.4 12.2 1.6 1.6 3.4-3.4M8.4 17h5.2" />
  </Svg>
);

export const IconTherapy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21.4c4-2.6 6.6-5.8 6.6-9.4a6.6 6.6 0 0 0-13.2 0c0 3.6 2.6 6.8 6.6 9.4Z" {...soft} />
    <path d="M8.2 12.6a3.8 3.8 0 1 1 7.6 0c0 2-1.6 3.6-3.8 5.4-2.2-1.8-3.8-3.4-3.8-5.4Z" />
    <path d="M5.4 8.4A6.6 6.6 0 0 1 12 3.4a6.6 6.6 0 0 1 6.6 5" />
  </Svg>
);

export const IconSilSda = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.4 10.6 12 3.6l8.6 7v9a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" {...soft} />
    <path d="M3.4 10.6 12 3.6l8.6 7v9a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6z" />
    <circle cx="12" cy="12.6" r="1.8" />
    <path d="M12 14.4v3.8M11 16.6h2" />
  </Svg>
);

/* ── Utility ────────────────────────────────────────────────────────────── */

export const IconGrid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.4" y="3.4" width="7" height="7" rx="2" {...soft} />
    <rect x="3.4" y="3.4" width="7" height="7" rx="2" />
    <rect x="13.6" y="3.4" width="7" height="7" rx="2" />
    <rect x="3.4" y="13.6" width="7" height="7" rx="2" />
    <rect x="13.6" y="13.6" width="7" height="7" rx="2" {...soft} />
    <rect x="13.6" y="13.6" width="7" height="7" rx="2" />
  </Svg>
);

export const IconVerified = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 2.6 2.4 1.8 3-.2.8 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.8 2.9-3-.2L12 20.6l-2.4-1.8-3 .2-.8-2.9L3.3 14.4l1.2-2.8-1.2-2.8 2.5-1.7.8-2.9 3 .2z" {...soft} />
    <path d="m12 2.6 2.4 1.8 3-.2.8 2.9 2.5 1.7-1.2 2.8 1.2 2.8-2.5 1.7-.8 2.9-3-.2L12 20.6l-2.4-1.8-3 .2-.8-2.9L3.3 14.4l1.2-2.8-1.2-2.8 2.5-1.7.8-2.9 3 .2z" />
    <path d="m8.8 11.6 2.2 2.2 4.2-4.4" />
  </Svg>
);

export const IconPulse = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" {...softer} />
    <path d="M2.8 12h4l2-5.4 3.4 10.8 2.2-5.4h6.8" />
  </Svg>
);

export const IconCrown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.4 8.2 7.9 12 12 5.2l4.1 6.8 4.5-3.8-1.9 10.4H5.3z" {...soft} />
    <path d="M3.4 8.2 7.9 12 12 5.2l4.1 6.8 4.5-3.8-1.9 10.4H5.3z" />
    <path d="M5.6 21h12.8" />
    <circle cx="12" cy="3.6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="3" cy="6.9" r="1" fill="currentColor" stroke="none" />
    <circle cx="21" cy="6.9" r="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconGem = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.4h12l3.4 5.2L12 20.6 2.6 8.6z" {...soft} />
    <path d="M6 3.4h12l3.4 5.2L12 20.6 2.6 8.6zM2.6 8.6h18.8M9 3.4l-1.6 5.2L12 20.6l4.6-12L15 3.4" />
  </Svg>
);

/* ── Trust and safety ───────────────────────────────────────────────────── */

export const IconScreening = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.6 4.2 5.8v6.4c0 4.5 3.2 7.9 7.8 9.2 4.6-1.3 7.8-4.7 7.8-9.2V5.8z" {...soft} />
    <path d="M12 2.6 4.2 5.8v6.4c0 4.5 3.2 7.9 7.8 9.2 4.6-1.3 7.8-4.7 7.8-9.2V5.8z" />
    <circle cx="12" cy="10.4" r="2.4" />
    <path d="M8.2 16.8a4.2 4.2 0 0 1 7.6 0" />
  </Svg>
);

export const IconPoliceCheck = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.6" width="18" height="14.8" rx="3" {...soft} />
    <rect x="3" y="4.6" width="18" height="14.8" rx="3" />
    <circle cx="8.8" cy="10.6" r="2.2" />
    <path d="M5.4 16.4a3.6 3.6 0 0 1 6.8 0M14.6 9.6h4M14.6 13.4h4" />
  </Svg>
);

export const IconFirstAid = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="6.4" width="18.4" height="13.2" rx="3" {...soft} />
    <rect x="2.8" y="6.4" width="18.4" height="13.2" rx="3" />
    <path d="M8.6 6.4V5a1.6 1.6 0 0 1 1.6-1.6h3.6A1.6 1.6 0 0 1 15.4 5v1.4" />
    <path d="M12 10v6M9 13h6" />
  </Svg>
);

export const IconInsurance = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.6 4.2 5.8v6.4c0 4.5 3.2 7.9 7.8 9.2 4.6-1.3 7.8-4.7 7.8-9.2V5.8z" {...soft} />
    <path d="M12 2.6 4.2 5.8v6.4c0 4.5 3.2 7.9 7.8 9.2 4.6-1.3 7.8-4.7 7.8-9.2V5.8z" />
    <path d="m8.6 11.8 2.4 2.4 4.4-4.6" />
  </Svg>
);

export const IconConduct = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3.4h14a1 1 0 0 1 1 1v15.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.4a1 1 0 0 1 1-1Z" {...soft} />
    <path d="M5 3.4h14a1 1 0 0 1 1 1v15.2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.4a1 1 0 0 1 1-1Z" />
    <path d="M8 8h8M8 11.6h8M8 15.2h4.8" />
  </Svg>
);

/* ── Accessibility ──────────────────────────────────────────────────────── */

export const IconTextSize = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.6 19.4 7.6 5.2l5 14.2M4.4 15h6.4" />
    <path d="M14.2 19.4 17.6 9.8l3.4 9.6M15.5 16.4h4.2" />
  </Svg>
);

export const IconContrast = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconEasyRead = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 5.4A9 9 0 0 1 12 7a9 9 0 0 1 8.8-1.6v12A9 9 0 0 0 12 19a9 9 0 0 0-8.8-1.6z" {...soft} />
    <path d="M3.2 5.4A9 9 0 0 1 12 7a9 9 0 0 1 8.8-1.6v12A9 9 0 0 0 12 19a9 9 0 0 0-8.8-1.6zM12 7v12" />
  </Svg>
);

export const IconAuslan = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.6 12.4V4.8a1.5 1.5 0 0 1 3 0v5.6" {...soft} />
    <path d="M8.6 12.4V4.8a1.5 1.5 0 0 1 3 0v5.6V3.6a1.5 1.5 0 0 1 3 0v6.8V6.2a1.5 1.5 0 0 1 3 0v8.2a6.6 6.6 0 0 1-6.6 6.6h-.6a5.4 5.4 0 0 1-4.2-2l-2.4-3a1.6 1.6 0 0 1 2.4-2.1z" />
  </Svg>
);

export const IconTranslate = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" {...softer} />
    <circle cx="12" cy="12" r="9.2" />
    <path d="M2.9 12h18.2M12 2.8a15 15 0 0 1 0 18.4M12 2.8a15 15 0 0 0 0 18.4" />
  </Svg>
);

/* ── Worker cards ───────────────────────────────────────────────────────── */

export const IconStar = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3.4 2.7 5.5 6 .9-4.35 4.25 1.03 6-5.38-2.83L6.62 20l1.03-6L3.3 9.8l6-.9z" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21.4s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" {...soft} />
    <path d="M12 21.4s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10.2" r="2.6" />
  </Svg>
);
