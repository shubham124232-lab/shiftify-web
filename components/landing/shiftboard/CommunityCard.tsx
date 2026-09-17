// Outline of mainland Australia plus Tasmania, drawn as a line icon.
function AustraliaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 58" fill="none" stroke="currentColor" strokeWidth={1.8}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M44 4 46 10 49 14 52 18 55 22 58 27 59 32 58 37 55 42 51 45 47 46 44 44 41 43 38 41 36 43 34 40 31 38 26 36 20 36 15 38 10 39 6 38 5 34 4 28 3 23 6 19 10 17 14 15 17 11 21 8 24 7 27 5 30 3 33 5 36 6 38 5 39 9 40 13 42 12 43 8Z" />
      <path d="M46 50 50 49.5 50.5 53 48 55 46 53Z" />
    </svg>
  );
}

export function CommunityCard() {
  return (
    <div className="sf-sb-panel sf-sb-community">
      <AustraliaIcon className="sf-sb-au" />
      <p className="sf-sb-mono">Real opportunities.</p>
      <h2>Stronger communities.</h2>
      <p className="sf-sb-community-body">
        Shiftify connects NDIS participants with trusted support workers, making it easier
        for more Australians to live the life they choose.
      </p>
      <span className="sf-sb-community-rule" aria-hidden="true" />
      <p className="sf-sb-community-script">
        Real people.<br />Real support.<br />Right timing.
      </p>
    </div>
  );
}
