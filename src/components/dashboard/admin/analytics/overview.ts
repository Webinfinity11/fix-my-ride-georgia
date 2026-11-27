// Pure calculations for the admin analytics overview. All days are Tbilisi days.

export type OverviewDay = {
  day: string;
  service_views: number; profile_views: number; service_clicks: number; mechanic_clicks: number;
  prev_service_views: number; prev_profile_views: number; prev_service_clicks: number; prev_mechanic_clicks: number;
};
export type Ranked = { id?: number; name: string; n: number };
export type Overview = {
  daily: OverviewDay[];
  /** Automated traffic in the period, left out of every number above. */
  filtered?: { views: number; clicks: number };
  hours: number[];
  top_viewed: Ranked[];
  top_clicked: Ranked[];
  top_searches: Ranked[];
};

// Georgia is UTC+4 all year (no daylight saving).
export const TBILISI_OFFSET = "+04:00";
export const tbilisiToday = (now = Date.now()) => new Date(now + 4 * 3600e3).toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The date the admin clicked in the calendar, whatever the browser's time zone. */
export const calendarDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const labelDM = (day: string) => { const [, m, d] = day.split("-"); return `${+d}/${+m}`; };

export type Metric = (d: OverviewDay, previous: boolean) => number;
export const serviceViews: Metric = (d, p) => (p ? d.prev_service_views : d.service_views);
export const profileViews: Metric = (d, p) => (p ? d.prev_profile_views : d.profile_views);
export const serviceClicks: Metric = (d, p) => (p ? d.prev_service_clicks : d.service_clicks);
export const mechanicClicks: Metric = (d, p) => (p ? d.prev_mechanic_clicks : d.mechanic_clicks);
export const allClicks: Metric = (d, p) => serviceClicks(d, p) + mechanicClicks(d, p);

export const total = (days: OverviewDay[], metric: Metric, previous = false) =>
  days.reduce((sum, d) => sum + metric(d, previous), 0);

/** Percent change, or null when there is nothing to compare with. */
export const change = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

/** Listing page → click on that listing's number, in percent with one decimal. */
export const conversion = (clicks: number, views: number) =>
  views > 0 ? Math.round((clicks / views) * 1000) / 10 : null;

export type Point = { label: string; current: number; previous: number; days: number };

/** Daily points, or 7-day buckets counted from the first day of the period. */
export function series(days: OverviewDay[], metric: Metric, weekly: boolean): Point[] {
  const size = weekly ? 7 : 1;
  const points: Point[] = [];
  for (let i = 0; i < days.length; i += size) {
    const bucket = days.slice(i, i + size);
    const first = labelDM(bucket[0].day);
    points.push({
      label: bucket.length > 1 ? `${first}–${labelDM(bucket[bucket.length - 1].day)}` : first,
      current: total(bucket, metric),
      previous: total(bucket, metric, true),
      days: bucket.length,
    });
  }
  return points;
}

export function dailyCsv(days: OverviewDay[]) {
  const header = "თარიღი,სერვისის ნახვები,პროფილის ნახვები,დაჭერა განცხადებაზე,დაჭერა პროფილზე";
  const rows = days.map((d) => [d.day, d.service_views, d.profile_views, d.service_clicks, d.mechanic_clicks].join(","));
  return [header, ...rows].join("\n");
}

export function downloadCsv(name: string, content: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + content], { type: "text/csv;charset=utf-8" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
