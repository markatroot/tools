import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AbuseIpdbClient } from './abuseipdb-client';
import { CheckOptions, CheckOutcome, CheckResponse, RateLimit } from './models';
import { ABUSEIPDB_CONFIG } from './provide-abuseipdb.token';

@Injectable()
export class HttpAbuseIpdbClient extends AbuseIpdbClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ABUSEIPDB_CONFIG);

  constructor() {
    super();
    this.concurrency = this.config.concurrency ?? 4;
  }

  check(ipAddress: string, apiKey: string, options: CheckOptions): Observable<CheckOutcome> {
    let params = new HttpParams().set('ipAddress', ipAddress).set('maxAgeInDays', options.maxAgeInDays);
    if (options.verbose) params = params.set('verbose', 'true');
    const headers = new HttpHeaders({ Key: apiKey, Accept: 'application/json' });

    return this.http
      .get<CheckResponse>(this.config.baseUrl + '/check', { params, headers, observe: 'response' })
      .pipe(
        map(res => {
          const limit = Number(res.headers.get('X-RateLimit-Limit'));
          const remaining = Number(res.headers.get('X-RateLimit-Remaining'));
          const rateLimit: RateLimit | null = res.headers.has('X-RateLimit-Limit') ? { limit, remaining } : null;
          return { result: res.body!.data, rateLimit };
        })
      );
  }
}
