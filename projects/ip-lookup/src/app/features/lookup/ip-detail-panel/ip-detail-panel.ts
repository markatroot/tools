import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IpCheckResult, RISK_LABELS, categoryName, countCategories, riskOf } from '@ip-tools/abuseipdb';
import { TimeAgoPipe } from '../../../shared/time-ago.pipe';

const RING: Record<string, string> = {
  high: 'var(--ip-danger-bar)', suspicious: 'var(--ip-warning-bar)', low: 'var(--ip-success-bar)', clean: 'var(--ip-success-bar)'
};

@Component({
  selector: 'ip-detail-panel',
  imports: [TimeAgoPipe],
  templateUrl: './ip-detail-panel.html',
  styleUrl: './ip-detail-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IpDetailPanel {
  readonly result = input.required<IpCheckResult>();
  readonly maxAgeInDays = input(90);
  readonly verbose = input(true);
  readonly closed = output<void>();

  protected readonly copied = signal(false);
  protected readonly categoryName = categoryName;

  protected readonly level = computed(() => riskOf(this.result().abuseConfidenceScore));
  protected readonly riskLabel = computed(() => RISK_LABELS[this.level()]);
  protected readonly ring = computed(() =>
    'conic-gradient(' + RING[this.level()] + ' ' + this.result().abuseConfidenceScore + '%, var(--ip-stroke-2) 0)'
  );

  protected readonly fields = computed(() => {
    const r = this.result();
    const yesNo = (v: boolean | null) => (v === null ? '—' : v ? 'Yes' : 'No');
    return [
      ['Country', r.countryName ? r.countryName + ' (' + r.countryCode + ')' : r.countryCode ?? '—'],
      ['ISP', r.isp ?? '—'],
      ['Domain', r.domain ?? '—'],
      ['Usage type', r.usageType ?? '—'],
      ['Hostnames', r.hostnames.length ? r.hostnames.join(', ') : '—'],
      ['Tor exit node', yesNo(r.isTor)],
      ['Whitelisted', yesNo(r.isWhitelisted)],
      ['Total reports', r.totalReports.toLocaleString()],
      ['Distinct reporters', r.numDistinctUsers.toLocaleString()],
      ['Last reported', r.lastReportedAt ? new Date(r.lastReportedAt).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'Never']
    ];
  });

  protected readonly categories = computed(() => {
    const list = countCategories(this.result().reports);
    const max = Math.max(1, ...list.map(c => c.count));
    return list.slice(0, 6).map(c => ({ ...c, pct: Math.round((c.count / max) * 100) }));
  });

  protected readonly recentReports = computed(() => (this.result().reports ?? []).slice(0, 3));

  protected readonly reportUrl = computed(() => 'https://www.abuseipdb.com/report?ip=' + encodeURIComponent(this.result().ipAddress));

  protected async copyJson(): Promise<void> {
    await navigator.clipboard.writeText(JSON.stringify(this.result(), null, 2));
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
