import { kv } from "@vercel/kv";
import { DateTime } from "luxon";
import { randomLocation } from "@/lib/geo";
import { sendTelegram } from "@/lib/telegram";

const OFFICE = {
  lat: -3.2795460218952925,
  lng: 119.85262806281504,
};

export default async function handler(req, res) {
  // Hanya izinkan GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const secret = url.searchParams.get("secret");

  // =====================
  // SECURITY
  // =====================
  if (secret !== process.env.ABSEN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const NIP = process.env.ABSEN_NIP;
  const TARGET_URL = process.env.ABSEN_TARGET_URL;

  if (!NIP || !TARGET_URL) {
    return res.status(500).json({ error: "Konfigurasi ENV belum lengkap" });
  }

  // =====================
  // TIME (WITA)
  // =====================
  const now = DateTime.now().setZone("Asia/Makassar");
  const weekday = now.weekday; // 1=Senin, 5=Jumat

  if (weekday > 5) {
    return res.json({ status: "libur" });
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
    return res.json({ status: "di_luar_jam_absen" });
  }

  // =====================
  // ANTI DOUBLE ABSEN
  // =====================
  const key = `absen:${now.toISODate()}:${type}`;
  if (await kv.get(key)) {
    return res.json({ status: "sudah_absen" });
  }

  // =====================
  // RANDOM LOKASI
  // =====================
  const location = randomLocation(OFFICE.lat, OFFICE.lng);

  // =====================
  // KIRIM KE ENDPOINT ABSENSI ASLI
  // =====================
  const payload = {
    nip: NIP,
    lokasi: `${location.lat},${location.lng}`,
  };

  const formBody = Object.entries(payload)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  try {
    const fetchRes = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Vercel Cron)",
      },
      body: formBody,
    });

    if (!fetchRes.ok) {
      const text = await fetchRes.text();
      return res.status(fetchRes.status).json({ error: text });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // =====================
  // SIMPAN LOG (ANTI DOUBLE)
  // =====================
  await kv.set(key, {
    nip: NIP,
    type,
    time: now.toISO(),
    location,
  });

  // =====================
  // TELEGRAM NOTIF
  // =====================
  await sendTelegram(`
✅ <b>ABSEN ${type.toUpperCase()} BERHASIL</b>

👤 NIP: <b>${NIP}</b>
📅 ${now.toFormat("cccc, dd LLL yyyy")}
⏰ ${now.toFormat("HH:mm")} WITA
📍 Jarak dari kantor: <b>${location.distance} meter</b>
`);

  return res.json({
    status: "success",
    type,
    nip: NIP,
    location,
  });
}
