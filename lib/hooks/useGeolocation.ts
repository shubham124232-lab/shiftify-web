'use client';

import { useCallback, useState } from 'react';

export type GeolocationStatus = 'idle' | 'pending' | 'granted' | 'denied' | 'unsupported';

interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; lng: number } | null;
  request: () => void;
}

// Wraps navigator.geolocation — always falls back gracefully (denial/error/
// no-API just leaves coords null) so the caller can fall back to the manual
// suburb field rather than the page ever getting stuck waiting on a prompt.
export function useGeolocation(): GeolocationState {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      return;
    }
    setStatus('pending');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return { status, coords, request };
}
