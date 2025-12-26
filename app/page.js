"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const update = () => {
      const now = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Makassar",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTime(now);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold text-center">
          Sistem Absensi Otomatis
        </h1>

        <p className="text-center text-sm text-gray-500">
          Zona Waktu: Asia / Makassar
        </p>

        <div className="text-center text-3xl font-mono">
          {time ?? "--:--:--"}
        </div>

        <a
          href="/api/absen"
          className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Test Endpoint Absensi
        </a>
      </div>
    </main>
  );
}
