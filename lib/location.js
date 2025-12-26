export function randomLocation(lat, lon, maxMeter = 20) {
  const r = maxMeter / 111320; // meter → derajat
  const u = Math.random();
  const v = Math.random();

  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;

  const latOffset = w * Math.cos(t);
  const lonOffset = (w * Math.sin(t)) / Math.cos((lat * Math.PI) / 180);

  return {
    lat: lat + latOffset,
    lon: lon + lonOffset,
  };
}
