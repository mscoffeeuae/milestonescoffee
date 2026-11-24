export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatKm(km: number, isAr: boolean): string {
  if (km < 1) return `${Math.round(km * 1000)} ${isAr ? 'م' : 'm'}`;
  return `${km.toFixed(1)} ${isAr ? 'كم' : 'km'}`;
}
