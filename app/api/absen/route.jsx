import { kv } from "@vercel/kv";
import { DateTime } from "luxon";
import { randomLocation } from "@/lib/geo";
import { sendTelegram } from "@/lib/telegram";

const OFFICE = {
  lat: -3.2795460218952925,
  lng: 119.85262806281504,
};
const MAX_RETRY = 5;
const MAX_DISTANCE = 20;

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  /* =====================
     SECURITY
  ====================== */
  if (searchParams.get("secret") !== process.env.ABSEN_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const NIP = process.env.ABSEN_NIP;
  const TARGET_URL = process.env.ABSEN_TARGET_URL;

  if (!NIP || !TARGET_URL) {
    return Response.json(
      { error: "Konfigurasi ENV belum lengkap" },
      { status: 500 }
    );
  }

  /* =====================
     TIME (WITA)
  ====================== */
  const now = DateTime.now().setZone("Asia/Makassar");
  const weekday = now.weekday; // 1=Senin, 5=Jumat

  if (weekday > 5) {
    return Response.json({ status: "libur" });
  }

  let type = null;

  // Senin–Kamis
  if (weekday >= 1 && weekday <= 4) {
    if (now.hour >= 6 && now.hour < 7) type = "masuk";
    if (now.hour >= 16 && now.hour < 17) type = "pulang";
  }

  // Jumat
  if (weekday === 5) {
    if (now.hour >= 6 && now.hour < 7) type = "masuk";
    if (now.hour >= 16 && now.hour < 18) type = "pulang";
  }

  if (!type) {
    return Response.json({ status: "di_luar_jam_absen" });
  }

  /* =====================
     ANTI DOUBLE ABSEN
  ====================== */
  const key = `absen:${now.toISODate()}:${type}`;
  if (await kv.get(key)) {
    return Response.json({ status: "sudah_absen" });
  }

  /* =====================
     RANDOM LOKASI
  ====================== */
  const location = randomLocation(OFFICE.lat, OFFICE.lng);

  /* =====================
     KIRIM KE ENDPOINT ABSENSI ASLI
  ====================== */
  const payload = {
    nip: NIP,
    lokasi: `${location.lat},${location.lng}`,
    // latitude: location.lat,
    // longitude: location.lng,
  };

  const res = await fetch(TARGET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal absen: ${text}`);
  }

  /* =====================
     SIMPAN LOG (ANTI DOUBLE)
  ====================== */
  await kv.set(key, {
    nip: NIP,
    type,
    time: now.toISO(),
    location,
  });

  /* =====================
     TELEGRAM NOTIF
  ====================== */
  await sendTelegram(`
✅ <b>ABSEN ${type.toUpperCase()} BERHASIL</b>

👤 NIP: <b>${NIP}</b>
📅 ${now.toFormat("cccc, dd LLL yyyy")}
⏰ ${now.toFormat("HH:mm")} WITA
📍 Jarak dari kantor: <b>${location.distance} meter</b>
`);

  return Response.json({
    status: "success",
    type,
    nip: NIP,
    location,
  });
}
