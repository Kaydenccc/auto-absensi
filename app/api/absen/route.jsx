import { kv } from "@vercel/kv";

// ====== WAKTU WITA ======
function getWitaTime() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Makassar",
    })
  );
}

// ====== WINDOW ABSENSI ======
function getAbsensiType(now) {
  const day = now.getDay(); // 0 = Minggu
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (day === 0 || day === 6) return null;

  // Jumat
  if (day === 5) {
    if (minutes >= 360 && minutes <= 420) return "masuk";
    if (minutes >= 990 && minutes <= 1050) return "pulang";
    return null;
  }

  // Senin–Kamis
  if (minutes >= 360 && minutes <= 420) return "masuk";
  if (minutes >= 960 && minutes <= 1020) return "pulang";

  return null;
}

// ====== LOKASI RANDOM < 20M ======
function randomOffset(maxMeters = 20) {
  return (Math.random() - 0.5) * (maxMeters / 111320);
}

function generateLocation() {
  const baseLat = -3.2795460218952925;
  const baseLng = 119.85262806281504;

  return {
    lat: baseLat + randomOffset(),
    lng: baseLng + randomOffset(),
  };
}

// ====== ENDPOINT ======
export async function GET() {
  const now = getWitaTime();
  const type = getAbsensiType(now);

  if (!type) {
    return Response.json({
      status: "SKIP",
      reason: "Outside absensi window",
      time: now.toISOString(),
    });
  }

  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const kvKey = `absen:${dateKey}:${type}`;

  // 🔐 CEK SUDAH ABSEN?
  const already = await kv.get(kvKey);
  if (already) {
    return Response.json({
      status: "SKIP",
      reason: "Already absented",
      type,
      date: dateKey,
    });
  }

  // 📍 LOKASI HARI INI
  const location = generateLocation();

  // ⬇️ SIMULASI ABSENSI
  const payload = {
    status: "SUCCESS",
    type,
    time: now.toISOString(),
    location,
  };

  console.log("ABSENSI:", payload);
  console.log("CRON CHECK", new Date().toISOString());

  // 🔐 SIMPAN KE KV (AUTO RESET 24 JAM)
  await kv.set(kvKey, payload, {
    ex: 60 * 60 * 24,
  });

  return Response.json(payload);
}
