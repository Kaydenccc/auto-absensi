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

  if (day === 0 || day === 6) return null; // Weekend

  // Jumat
  if (day === 5) {
    if (minutes >= 360 && minutes <= 420) return "masuk"; // 06:00–07:00
    if (minutes >= 990 && minutes <= 1050) return "pulang"; // 16:30–17:30
    return null;
  }

  // Senin–Kamis
  if (minutes >= 360 && minutes <= 420) return "masuk"; // 06:00–07:00
  if (minutes >= 960 && minutes <= 1020) return "pulang"; // 16:00–17:00

  return null;
}

// ====== LOKASI RANDOM < 20m ======
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

  const location = generateLocation();

  // ⚠️ SIMULASI (nanti ganti API absensi asli)
  const payload = {
    status: "SUCCESS",
    type,
    time: now.toISOString(),
    location,
  };

  console.log("ABSENSI:", payload);

  return Response.json(payload);
}
