/** AbuseIPDB report category ids. https://www.abuseipdb.com/categories */
export const ABUSE_CATEGORIES: Readonly<Record<number, string>> = {
  1: 'DNS Compromise',
  2: 'DNS Poisoning',
  3: 'Fraud Orders',
  4: 'DDoS Attack',
  5: 'FTP Brute-Force',
  6: 'Ping of Death',
  7: 'Phishing',
  8: 'Fraud VoIP',
  9: 'Open Proxy',
  10: 'Web Spam',
  11: 'Email Spam',
  12: 'Blog Spam',
  13: 'VPN IP',
  14: 'Port Scan',
  15: 'Hacking',
  16: 'SQL Injection',
  17: 'Spoofing',
  18: 'Brute-Force',
  19: 'Bad Web Bot',
  20: 'Exploited Host',
  21: 'Web App Attack',
  22: 'SSH',
  23: 'IoT Targeted'
};

export function categoryName(id: number): string {
  return ABUSE_CATEGORIES[id] ?? 'Category ' + id;
}

export interface CategoryCount {
  id: number;
  name: string;
  count: number;
}

/** Counts categories across a result's verbose reports, most frequent first. */
export function countCategories(reports: { categories: number[] }[] | undefined): CategoryCount[] {
  const counts = new Map<number, number>();
  for (const r of reports ?? []) for (const c of r.categories) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, name: categoryName(id), count }))
    .sort((a, b) => b.count - a.count);
}
