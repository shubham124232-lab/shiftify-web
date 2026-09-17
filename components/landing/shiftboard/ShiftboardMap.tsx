'use client';

// Rendered only via next/dynamic({ssr:false}) from ShiftboardBoard — Leaflet
// touches `window` at import time, so this file must never be part of the
// server-rendered tree.
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ShiftboardJob } from '@/lib/types/shiftboard';

const URGENCY_COLOR: Record<ShiftboardJob['urgency'], string> = {
  RAPID: '#e0446a',
  URGENT: '#e08a2e',
  LAST_MINUTE: '#2fa871',
  ROUTINE: '#4b6fb0',
};

// A colored divIcon sidesteps Leaflet's default marker image path entirely —
// the well-known Next.js/Webpack asset-path issue with iconUrl/shadowUrl
// never comes up because we never reference Leaflet's default icon images.
function pinIcon(color: string) {
  return L.divIcon({
    className: 'sf-shiftboard-pin',
    html: `<span style="background:${color}"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export default function ShiftboardMap({
  jobs, center,
}: {
  jobs: ShiftboardJob[];
  center: { lat: number; lng: number };
}) {
  const pins = jobs.filter((j) => j.lat != null && j.lng != null);

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={10} scrollWheelZoom={false} className="sf-shiftboard-map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((job) => (
        <Marker key={job.id} position={[job.lat as number, job.lng as number]} icon={pinIcon(URGENCY_COLOR[job.urgency])}>
          <Popup>
            <strong>{job.suburb}</strong><br />
            {job.title}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
