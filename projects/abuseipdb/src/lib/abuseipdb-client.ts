import { Observable, catchError, from, map, mergeMap, of } from 'rxjs';
import { BulkCheckItem, CheckOptions, CheckOutcome } from './models';

/**
 * Injectable client contract. Apps get either the HTTP or the mock
 * implementation through provideAbuseIpdb().
 */
export abstract class AbuseIpdbClient {
  protected concurrency = 4;

  abstract check(
    ipAddress: string,
    apiKey: string,
    options: CheckOptions,
  ): Observable<CheckOutcome>;

  /** Checks several addresses with limited concurrency; emits one item per address as it completes. */
  checkMany(
    ips: string[],
    apiKey: string,
    options: CheckOptions,
  ): Observable<BulkCheckItem> {
    return from(ips).pipe(
      mergeMap(
        (ip) =>
          this.check(ip, apiKey, options).pipe(
            map(
              (o): BulkCheckItem => ({
                ok: true,
                ipAddress: ip,
                result: o.result,
                rateLimit: o.rateLimit,
              }),
            ),
            catchError((err) =>
              of<BulkCheckItem>({
                ok: false,
                ipAddress: ip,
                ...describeError(err),
              }),
            ),
          ),
        this.concurrency,
      ),
    );
  }
}

export function describeError(err: unknown): {
  message: string;
  status: number;
} {
  const e = err as {
    status?: number;
    error?: { errors?: { detail?: string }[] };
    message?: string;
  };
  const status = e?.status ?? 0;
  const detail = e?.error?.errors?.[0]?.detail;
  if (detail) return { message: detail, status };
  if (status === 0)
    return { message: 'Network error. Is the dev proxy running?', status };
  if (status === 401)
    return { message: 'Authentication failed. Check your API key.', status };
  if (status === 429) return { message: 'Daily rate limit reached.', status };
  if (status === 422)
    return { message: 'AbuseIPDB rejected this address.', status };
  return { message: e?.message ?? 'Request failed', status };
}
