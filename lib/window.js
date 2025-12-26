// lib/window.js
export function getWindowWITA(now) {
  const day = now.getDay(); // WITA
  if (day === 0 || day === 6) return null;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const isFriday = day === 5;

  if (minutes >= 360 && minutes <= 420) {
    return "masuk"; // 06:00–07:00
  }

  if (
    (!isFriday && minutes >= 960 && minutes <= 1020) || // 16:00–17:00
    (isFriday && minutes >= 990 && minutes <= 1050) // 16:30–17:30
  ) {
    return "pulang";
  }

  return null;
}
