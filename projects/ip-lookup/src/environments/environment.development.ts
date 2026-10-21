export const environment = {
  production: false,
  /** Forwarded to https://api.abuseipdb.com by proxy.conf.json during ng serve. */
  abuseIpdbBaseUrl: '/abuseipdb/api/v2',
  /** true = generated data, no API calls. Set false to hit the real API through the proxy. */
  useMock: true,
};
