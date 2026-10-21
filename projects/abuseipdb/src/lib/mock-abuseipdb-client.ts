import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { AbuseIpdbClient } from './abuseipdb-client';
import {
  AbuseReport,
  CheckOptions,
  CheckOutcome,
  IpCheckResult,
} from './models';

const COUNTRIES: [string, string][] = [
  ['US', 'United States'],
  ['DE', 'Germany'],
  ['NL', 'Netherlands'],
  ['CN', 'China'],
  ['RU', 'Russia'],
  ['BR', 'Brazil'],
  ['VN', 'Vietnam'],
  ['IN', 'India'],
  ['SG', 'Singapore'],
  ['FR', 'France'],
  ['PH', 'Philippines'],
  ['KR', 'South Korea'],
];
const ISPS: [string, string, string][] = [
  ['DigitalOcean LLC', 'digitalocean.com', 'Data Center/Web Hosting/Transit'],
  ['OVH SAS', 'ovh.net', 'Data Center/Web Hosting/Transit'],
  ['Chinanet', 'chinatelecom.com.cn', 'Fixed Line ISP'],
  ['Hetzner Online GmbH', 'hetzner.com', 'Data Center/Web Hosting/Transit'],
  ['Viettel Group', 'viettel.com.vn', 'Mobile ISP'],
  ['PLDT Inc.', 'pldt.com.ph', 'Fixed Line ISP'],
  ['Amazon Technologies', 'amazonaws.com', 'Data Center/Web Hosting/Transit'],
  ['Comcast Cable', 'comcast.net', 'Fixed Line ISP'],
  ['Cloudflare, Inc.', 'cloudflare.com', 'Content Delivery Network'],
  ['Telefonica Brasil', 'vivo.com.br', 'Mobile ISP'],
];
const CATEGORY_IDS = [3, 4, 9, 10, 11, 14, 15, 18, 19, 20, 21, 22, 23];
const COMMENTS = [
  'Failed password for root from {ip} port 52144 ssh2',
  'GET /wp-login.php 404, repeated 120x in 2 min',
  'Incoming SYN scan on ports 22,23,2323,8080',
  'Postfix: SASL LOGIN authentication failed',
  'Blocked by WAF rule 942100 (SQL injection)',
  'Telnet login attempt with default credentials',
];
const PRIVATE =
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)|^(fe80|fc|fd)|^::1$/i;

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic fake data for UI work without spending API quota. */
@Injectable()
export class MockAbuseIpdbClient extends AbuseIpdbClient {
  private remaining = 1000;

  check(
    ipAddress: string,
    apiKey: string,
    options: CheckOptions,
  ): Observable<CheckOutcome> {
    if (!apiKey.trim()) return throwError(() => ({ status: 401 }));
    this.remaining = Math.max(0, this.remaining - 1);
    const result = generate(ipAddress, options);
    return of({
      result,
      rateLimit: { limit: 1000, remaining: this.remaining },
    }).pipe(delay(250 + (hash(ipAddress) % 400)));
  }
}

function generate(
  ip: string,
  { maxAgeInDays, verbose }: CheckOptions,
): IpCheckResult {
  const h = hash(ip);
  const isPublic = !PRIVATE.test(ip);
  const score = isPublic ? [100, 92, 64, 38, 7, 0, 81, 15, 0, 53][h % 10] : 0;
  const scale = maxAgeInDays / 90;
  const totalReports =
    score === 0
      ? 0
      : Math.round((((h >>> 5) % 900) + score * 6) * Math.max(0.4, scale));
  const country = COUNTRIES[h % COUNTRIES.length];
  const isp = ISPS[(h >>> 3) % ISPS.length];
  const now = Date.now();
  const last = totalReports
    ? now - ((h >>> 7) % (maxAgeInDays * 24)) * 36e5 * 0.3
    : null;

  const reports: AbuseReport[] = [];
  if (verbose && totalReports) {
    for (let i = 0; i < Math.min(5, totalReports); i++) {
      const rc = COUNTRIES[(h >>> (i + 2)) % COUNTRIES.length];
      reports.push({
        reportedAt: new Date(
          last! - i * 36e5 * (3 + ((h >>> i) % 20)),
        ).toISOString(),
        comment: COMMENTS[(h >>> i) % COMMENTS.length].replace('{ip}', ip),
        categories: [
          CATEGORY_IDS[(h >>> i) % CATEGORY_IDS.length],
          CATEGORY_IDS[(h >>> (i + 4)) % CATEGORY_IDS.length],
        ],
        reporterId: 1000 + ((h >>> i) % 90000),
        reporterCountryCode: rc[0],
        reporterCountryName: rc[1],
      });
    }
  }

  return {
    ipAddress: ip,
    isPublic,
    ipVersion: ip.includes(':') ? 6 : 4,
    isWhitelisted: isPublic ? false : null,
    abuseConfidenceScore: score,
    countryCode: isPublic ? country[0] : null,
    ...(verbose ? { countryName: isPublic ? country[1] : null } : {}),
    usageType: isPublic ? isp[2] : 'Reserved',
    isp: isPublic ? isp[0] : null,
    domain: isPublic ? isp[1] : null,
    hostnames:
      isPublic && h % 3 === 0 ? ['host-' + (h % 9999) + '.' + isp[1]] : [],
    isTor: isPublic && h % 17 === 0,
    totalReports,
    numDistinctUsers: totalReports
      ? Math.max(1, Math.round(totalReports / (3 + (h % 7))))
      : 0,
    lastReportedAt: last ? new Date(last).toISOString() : null,
    ...(verbose ? { reports } : {}),
  };
}
