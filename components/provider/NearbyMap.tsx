"use client";

// Leaflet part of the Provider "Nearby staffing requests" popup. Loaded only via next/dynamic({ ssr: false }) — Leaflet touches `window` on import.
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPin { id: string; lat: number; lng: number; color: string; title: string; suburb: string; selected: boolean; onSelect: () => void }

// Drawn divIcon avoids Leaflet's default marker image path problem under Next/Webpack.
function pinIcon(color: string, selected: boolean) {
  const size = selected ? 30 : 24;
  return L.divIcon({
    className: "",
    html: `<svg viewBox="0 0 24 32" width="${size}" height="${Math.round(size * 1.33)}" aria-hidden="true"><path style="fill:${color}" d="M12 1C6.2 1 1.5 5.6 1.5 11.4 1.5 19.2 12 31 12 31s10.5-11.8 10.5-19.6C22.5 5.6 17.8 1 12 1Z"/><circle cx="12" cy="11.4" r="3.6" fill="#fff"/></svg>`,
    iconSize: [size, Math.round(size * 1.33)],
    iconAnchor: [size / 2, Math.round(size * 1.33)],
    popupAnchor: [0, -size],
  });
}

const originIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function NearbyMap({ origin, radiusKm, pins }: { origin: { lat: number; lng: number }; radiusKm: number; pins: MapPin[] }) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    if (!map) return;
    map.invalidateSize();
    map.fitBounds(L.latLng(origin.lat, origin.lng).toBounds(radiusKm * 2000), { padding: [16, 16] });
  }, [map, origin.lat, origin.lng, radiusKm]);

  return (
    <MapContainer ref={setMap} center={[origin.lat, origin.lng]} zoom={10} scrollWheelZoom={false} className="h-[340px] w-full rounded-xl border border-slate-200">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={[origin.lat, origin.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#db2777", weight: 2, fillColor: "#db2777", fillOpacity: 0.06, interactive: false }} />
      <Marker position={[origin.lat, origin.lng]} icon={originIcon}><Popup>Starting location</Popup></Marker>
      {pins.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.color, p.selected)} eventHandlers={{ click: p.onSelect }}>
          <Popup><strong>{p.suburb}</strong><br />{p.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
