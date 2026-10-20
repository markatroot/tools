/** Shapes returned by the AbuseIPDB v2 /check endpoint. */
export interface AbuseReport {
  reportedAt: string;
  comment: string;
  categories: number[];
  reporterId: number;
  reporterCountryCode: string;
  reporterCountryName: string;
}

export interface IpCheckResult {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: 4 | 6;
  isWhitelisted: boolean | null;
  abuseConfidenceScore: number;
  countryCode: string | null;
  /** Only present when verbose is requested. */
  countryName?: string | null;
  usageType: string | null;
  isp: string | null;
  domain: string | null;
  hostnames: string[];
  isTor: boolean;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
  /** Only present when verbose is requested. */
  reports?: AbuseReport[];
}

export interface CheckResponse {
  data: IpCheckResult;
}

export interface CheckOptions {
  maxAgeInDays: number;
  verbose: boolean;
}

export interface RateLimit {
  limit: number;
  remaining: number;
}

export interface CheckOutcome {
  result: IpCheckResult;
  rateLimit: RateLimit | null;
}

export type BulkCheckItem =
  | { ok: true; ipAddress: string; result: IpCheckResult; rateLimit: RateLimit | null }
  | { ok: false; ipAddress: string; message: string; status: number };
