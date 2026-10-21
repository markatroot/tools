import { InjectionToken } from '@angular/core';

export interface AbuseIpdbConfig {
  /** Base URL of the v2 API, usually a proxy path such as /abuseipdb/api/v2. */
  baseUrl: string;
  /** Parallel requests for bulk checks. Default 4. */
  concurrency?: number;
  /** Use generated data instead of calling the API. */
  mock?: boolean;
}

export const ABUSEIPDB_CONFIG = new InjectionToken<AbuseIpdbConfig>(
  'ABUSEIPDB_CONFIG',
);
