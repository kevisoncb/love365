export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function diffParts(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += lastMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diffMs / (1000 * 60)) % 60);
  const secs = Math.floor((diffMs / 1000) % 60);

  return { years, months, days, hours, mins, secs };
}
