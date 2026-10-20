import { categoryName } from './categories';
import { IpCheckResult } from './models';
import { RISK_LABELS, riskOf } from './risk';

export interface TemplateVariable {
  name: string;
  description: string;
}

export const TEMPLATE_VARIABLES: readonly TemplateVariable[] = [
  { name: 'ipAddress', description: 'Address checked' },
  { name: 'abuseConfidenceScore', description: 'Score 0-100' },
  { name: 'risk', description: 'High risk, Suspicious, Low, Clean' },
  { name: 'countryCode', description: 'ISO country code' },
  { name: 'countryName', description: 'Country name (verbose)' },
  { name: 'isp', description: 'ISP' },
  { name: 'domain', description: 'Domain' },
  { name: 'usageType', description: 'Usage type' },
  { name: 'hostnames', description: 'Hostnames, comma separated' },
  { name: 'totalReports', description: 'Reports in window' },
  { name: 'numDistinctUsers', description: 'Distinct reporters' },
  { name: 'lastReportedAt', description: 'Last report (UTC)' },
  { name: 'categories', description: 'Categories from reports (verbose)' },
  { name: 'isTor', description: 'yes / no' },
  { name: 'isWhitelisted', description: 'yes / no' },
  { name: 'isPublic', description: 'yes / no' },
  { name: 'ipVersion', description: '4 or 6' },
  { name: 'maxAgeInDays', description: 'Report window' },
  { name: 'checkedAt', description: 'When the check ran (UTC)' }
];

const KNOWN = new Set(TEMPLATE_VARIABLES.map(v => v.name));
const TOKEN = /\{(\w+)\}/g;

export interface TemplatePreset {
  label: string;
  template: string;
}

export const TEMPLATE_PRESETS: readonly TemplatePreset[] = [
  {
    label: 'Summary',
    template: [
      '{ipAddress}  {abuseConfidenceScore}% ({risk})',
      'Country: {countryName} ({countryCode})',
      'ISP: {isp}, {usageType}',
      'Reports: {totalReports} from {numDistinctUsers} users, last {lastReportedAt}',
      'Categories: {categories}'
    ].join('\n')
  },
  { label: 'One line', template: '{ipAddress} | {abuseConfidenceScore}% | {countryCode} | {isp} | {totalReports} reports' },
  { label: 'CSV row', template: '{ipAddress},{abuseConfidenceScore},{countryCode},"{isp}",{usageType},{totalReports},{lastReportedAt}' },
  {
    label: 'Ticket note',
    template: [
      'IP {ipAddress} was checked against AbuseIPDB on {checkedAt}.',
      'Confidence of abuse: {abuseConfidenceScore}% ({risk}), {totalReports} reports in the last {maxAgeInDays} days.',
      'Owner: {isp} ({domain}), {countryName}. Tor: {isTor}. Whitelisted: {isWhitelisted}.'
    ].join('\n')
  }
];

export const DEFAULT_TEMPLATE = TEMPLATE_PRESETS[0].template;

export type Separator = 'blank' | 'line' | 'none';

export const SEPARATORS: Readonly<Record<Separator, { label: string; value: string }>> = {
  blank: { label: 'Blank line', value: '\n\n' },
  line: { label: 'Divider line', value: '\n' + '-'.repeat(40) + '\n' },
  none: { label: 'Nothing', value: '\n' }
};

export interface TemplateContext {
  maxAgeInDays: number;
  checkedAt: Date;
}

const utc = (d: Date) => d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const yesNo = (v: boolean | null | undefined) => (v ? 'yes' : 'no');

export function buildTemplateVars(r: IpCheckResult, ctx: TemplateContext): Record<string, string> {
  const cats = [...new Set((r.reports ?? []).flatMap(rep => rep.categories))].map(categoryName);
  return {
    ipAddress: r.ipAddress,
    abuseConfidenceScore: String(r.abuseConfidenceScore),
    risk: RISK_LABELS[riskOf(r.abuseConfidenceScore)],
    countryCode: r.countryCode ?? '',
    countryName: r.countryName ?? r.countryCode ?? 'n/a',
    isp: r.isp ?? '',
    domain: r.domain ?? '',
    usageType: r.usageType ?? '',
    hostnames: r.hostnames.length ? r.hostnames.join(', ') : 'none',
    totalReports: String(r.totalReports),
    numDistinctUsers: String(r.numDistinctUsers),
    lastReportedAt: r.lastReportedAt ? utc(new Date(r.lastReportedAt)) : 'never',
    categories: cats.length ? cats.join(', ') : 'none',
    isTor: yesNo(r.isTor),
    isWhitelisted: yesNo(r.isWhitelisted),
    isPublic: yesNo(r.isPublic),
    ipVersion: String(r.ipVersion),
    maxAgeInDays: String(ctx.maxAgeInDays),
    checkedAt: utc(ctx.checkedAt)
  };
}

/** Replaces {name} tokens; unknown tokens are left as typed. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(TOKEN, (match, name: string) => (name in vars ? vars[name] : match));
}

export function renderResults(template: string, separator: Separator, results: IpCheckResult[], ctx: TemplateContext): string {
  return results.map(r => renderTemplate(template, buildTemplateVars(r, ctx))).join(SEPARATORS[separator].value);
}

export function findUnknownVariables(template: string): string[] {
  const found = template.match(TOKEN) ?? [];
  return [...new Set(found.filter(t => !KNOWN.has(t.slice(1, -1))))];
}

export type TemplateSegmentKind = 'text' | 'variable' | 'unknown';

export interface TemplateSegment {
  text: string;
  kind: TemplateSegmentKind;
}

export function segmentTemplate(template: string): TemplateSegment[] {
  return template
    .split(/(\{\w+\})/)
    .filter(t => t !== '')
    .map(t => {
      const m = /^\{(\w+)\}$/.exec(t);
      return { text: t, kind: !m ? 'text' : KNOWN.has(m[1]) ? 'variable' : 'unknown' };
    });
}
