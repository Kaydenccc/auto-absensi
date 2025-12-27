export function randomLocation(lat, lng, maxMeters = 20) {
  const r = Math.random() * maxMeters;
  const theta = Math.random() * 2 * Math.PI;

  const dx = r * Math.cos(theta);
  const dy = r * Math.sin(theta);

  return {
    lat: lat + dy / 111111,
    lng: lng + dx / (111111 * Math.cos((lat * Math.PI) / 180)),
    distance: Math.round(r),
  };
}
