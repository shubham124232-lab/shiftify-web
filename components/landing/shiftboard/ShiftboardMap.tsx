'use client';

// Rendered only via next/dynamic({ssr:false}) from ShiftboardBoard — Leaflet
// touches `window` at import time, so this file must never be part of the
// server-rendered tree.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L, { type Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Minus, Pencil, Plus } from 'lucide-react';
import { RADIUS_OPTIONS } from '@/lib/constants/job-filters';
import type { ShiftboardJob, ShiftboardUrgency } from '@/lib/types/shiftboard';
import { SHIFTBOARD_URGENCY, URGENCY_ORDER } from './urgency';

// A drawn divIcon sidesteps Leaflet's default marker image path entirely —
// the well-known Next.js/Webpack asset-path issue with iconUrl/shadowUrl
// never comes up. Colour goes through `style` because SVG presentation
// attributes don't resolve CSS variables.
function pinIcon(color: string) {
  return L.divIcon({
    className: 'sf-sb-pin',
    html: `<svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true"><path style="fill:${color}" d="M12 1C6.2 1 1.5 5.6 1.5 11.4 1.5 19.2 12 31 12 31s10.5-11.8 10.5-19.6C22.5 5.6 17.8 1 12 1Z"/><circle cx="12" cy="11.4" r="3.6" fill="#fff" fill-opacity=".85"/></svg>`,
    iconSize: [22, 30],
    iconAnchor: [11, 30],
    popupAnchor: [0, -26],
  });
}

const PIN_ICONS = Object.fromEntries(
  URGENCY_ORDER.map((u) => [u, pinIcon(SHIFTBOARD_URGENCY[u].color)]),
) as Record<ShiftboardUrgency, L.DivIcon>;

export default function ShiftboardMap({
  jobs, center, hasLocation, radiusKm, expanded, locating, onRadiusChange, onLocate,
}: {
  jobs: ShiftboardJob[];
  center: { lat: number; lng: number };
  hasLocation: boolean;
  radiusKm: number;
  expanded: boolean;
  locating: boolean;
  onRadiusChange: (km: number) => void;
  onLocate: () => void;
}) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const pins = jobs.filter((j) => j.lat != null && j.lng != null);

  // MapContainer only reads `center` on mount, so follow later changes here.
  // With a known location, frame the search radius instead of a fixed zoom.
  useEffect(() => {
    if (!map) return;
    if (hasLocation) {
      map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusKm * 2000), { padding: [18, 18] });
    } else {
      map.setView([center.lat, center.lng], 10);
    }
  }, [map, center.lat, center.lng, radiusKm, hasLocation]);

  useEffect(() => { map?.invalidateSize(); }, [map, expanded]);

  return (
    <div className={`sf-sb-map${expanded ? ' expanded' : ''}`}>
      <MapContainer
        ref={setMap}
        center={[center.lat, center.lng]}
        zoom={10}
        zoomControl={false}
        scrollWheelZoom={false}
        className="sf-sb-map-canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          // Greyscale "Positron" base so only the theme accents (pink radius,
          // lane-colour pins) carry colour.
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {hasLocation && (
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ className: 'sf-sb-radius', interactive: false }}
          />
        )}
        {pins.map((job) => (
          <Marker key={job.id} position={[job.lat as number, job.lng as number]} icon={PIN_ICONS[job.urgency]}>
            <Popup>
              <strong>{job.suburb}</strong><br />
              {SHIFTBOARD_URGENCY[job.urgency].label} · {job.title}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <button type="button" className="sf-sb-map-locate" onClick={onLocate} disabled={locating} aria-label="Use my current location">
        <LocateFixed aria-hidden="true" strokeWidth={2} />
      </button>

      <div className="sf-sb-map-zoom">
        <button type="button" onClick={() => map?.zoomIn()} aria-label="Zoom in"><Plus aria-hidden="true" strokeWidth={2.2} /></button>
        <button type="button" onClick={() => map?.zoomOut()} aria-label="Zoom out"><Minus aria-hidden="true" strokeWidth={2.2} /></button>
      </div>

      <label className="sf-sb-map-radius">
        <span>{radiusKm} km radius</span>
        <Pencil aria-hidden="true" strokeWidth={2} />
        <select aria-label="Search radius" value={radiusKm} onChange={(e) => onRadiusChange(Number(e.target.value))}>
          {RADIUS_OPTIONS.map((km) => <option key={km} value={km}>{km} km radius</option>)}
        </select>
      </label>
    </div>
  );
}
