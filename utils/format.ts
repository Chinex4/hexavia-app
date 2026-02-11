export const formatTime = (ts: number) => {
  const d = new Date(ts);
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${ampm}`;
};

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const getDateKey = (ts: number) => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const formatDateLabel = (ts: number, nowTs: number = Date.now()) => {
  const todayStart = startOfDay(new Date(nowTs));
  const msgStart = startOfDay(new Date(ts));
  const dayMs = 24 * 60 * 60 * 1000;

  if (msgStart === todayStart) return "Today";
  if (msgStart === todayStart - dayMs) return "Yesterday";

  const fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return fmt.format(new Date(ts));
};
