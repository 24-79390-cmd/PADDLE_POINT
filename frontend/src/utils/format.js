const TZ = "Asia/Manila";

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-PH", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export const fmtRange = (start, end) => `${fmtDate(start)} · ${fmtTime(start)} – ${fmtTime(end)}`;

export const peso = (n) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// 14 -> "2:00 PM"
export const hourLabel = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 || h === 24 ? "AM" : "PM"}`;

// Today's date in Philippine time, as YYYY-MM-DD
export const todayPH = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

// ISO timestamp -> { date: "YYYY-MM-DD", hour: 14 } in Philippine time
export const phParts = (iso) => {
  const shifted = new Date(new Date(iso).getTime() + 8 * 3600 * 1000).toISOString();
  return { date: shifted.slice(0, 10), hour: Number(shifted.slice(11, 13)) };
};

export const errorMessage = (err, fallback = "Something went wrong.") =>
  err?.response?.data?.message || fallback;
