import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AbuseIpdbClient } from './abuseipdb-client';
import { HttpAbuseIpdbClient } from './http-abuseipdb-client';
import { MockAbuseIpdbClient } from './mock-abuseipdb-client';
import { ABUSEIPDB_CONFIG, AbuseIpdbConfig } from './provide-abuseipdb.token';

export { ABUSEIPDB_CONFIG } from './provide-abuseipdb.token';
export type { AbuseIpdbConfig } from './provide-abuseipdb.token';

/** Registers the AbuseIPDB client. Requires provideHttpClient() unless mock is true. */
export function provideAbuseIpdb(config: AbuseIpdbConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ABUSEIPDB_CONFIG, useValue: config },
    { provide: AbuseIpdbClient, useClass: config.mock ? MockAbuseIpdbClient : HttpAbuseIpdbClient }
  ]);
}
