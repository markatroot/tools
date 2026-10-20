const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HEX = /^[0-9a-f]{1,4}$/i;
const SEPARATOR = /[\s,;]+/;

export function isIPv4(value: string): boolean {
  return IPV4.test(value);
}

export function isIPv6(value: string): boolean {
  if (!value.includes(':')) return false;
  let v = value;
  const lastColon = v.lastIndexOf(':');
  const tail = v.slice(lastColon + 1);
  let groupsNeeded = 8;
  if (tail.includes('.')) {
    if (!isIPv4(tail)) return false;
    v = v.slice(0, lastColon + 1) + '0:0';
  }
  const doubles = v.split('::');
  if (doubles.length > 2) return false;
  const parts = (s: string) => (s === '' ? [] : s.split(':'));
  if (doubles.length === 2) {
    const groups = [...parts(doubles[0]), ...parts(doubles[1])];
    return groups.length < groupsNeeded && groups.every(g => HEX.test(g));
  }
  const groups = parts(v);
  return groups.length === groupsNeeded && groups.every(g => HEX.test(g));
}

export function isValidIp(value: string): boolean {
  return isIPv4(value) || isIPv6(value);
}

export interface ParsedIpList {
  /** Every non-empty token, in input order. */
  tokens: string[];
  /** Valid, de-duplicated addresses, capped at maxCount. */
  valid: string[];
  /** Unique tokens that are not valid IPs. */
  invalid: string[];
  duplicates: number;
}

export function parseIpList(text: string, maxCount = 100): ParsedIpList {
  const tokens = text.split(SEPARATOR).map(t => t.trim()).filter(Boolean);
  const unique = [...new Set(tokens)];
  return {
    tokens,
    valid: unique.filter(isValidIp).slice(0, maxCount),
    invalid: unique.filter(t => !isValidIp(t)),
    duplicates: tokens.length - unique.length
  };
}

export type IpTextSegmentKind = 'valid' | 'invalid' | 'separator';

export interface IpTextSegment {
  text: string;
  kind: IpTextSegmentKind;
}

/** Splits raw input into segments for inline valid/invalid highlighting. */
export function segmentIpText(text: string): IpTextSegment[] {
  return text
    .split(/([\s,;]+)/)
    .filter(t => t !== '')
    .map(t => ({
      text: t,
      kind: /^[\s,;]+$/.test(t) ? 'separator' : isValidIp(t) ? 'valid' : 'invalid'
    }));
}
