import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AbuseIpdbClient, DEFAULT_TEMPLATE, IpCheckResult, RateLimit, Separator,
  parseIpList, renderResults, riskOf
} from '@ip-tools/abuseipdb';

export type ResultFilter = 'all' | 'high' | 'suspicious' | 'clean';
export type ResultSort = 'score' | 'reports' | 'input';
export type ResultView = 'table' | 'text';

export interface FailedLookup {
  ipAddress: string;
  message: string;
}

const TEMPLATE_KEY = 'ip-lookup.template.v1';

function loadTemplate(): { template: string; separator: Separator } {
  try {
    const v = JSON.parse(localStorage.getItem(TEMPLATE_KEY) ?? 'null');
    if (v && typeof v.template === 'string') return v;
  } catch { /* ignore */ }
  return { template: DEFAULT_TEMPLATE, separator: 'blank' };
}

@Injectable({ providedIn: 'root' })
export class LookupStore {
  private readonly client = inject(AbuseIpdbClient);
  private sub?: Subscription;

  // form
  readonly apiKey = signal('');
  readonly ipText = signal('');
  readonly maxAgeInDays = signal(90);
  readonly verbose = signal(true);

  // results
  readonly results = signal<IpCheckResult[] | null>(null);
  readonly failed = signal<FailedLookup[]>([]);
  readonly skipped = signal<string[]>([]);
  readonly loading = signal(false);
  readonly progress = signal({ done: 0, total: 0 });
  readonly rateLimit = signal<RateLimit | null>(null);
  readonly checkedAt = signal<Date>(new Date());
  readonly checkedWindow = signal(90);
  readonly checkedVerbose = signal(true);

  // view
  readonly filter = signal<ResultFilter>('all');
  readonly sort = signal<ResultSort>('score');
  readonly view = signal<ResultView>('table');
  readonly selectedIp = signal<string | null>(null);

  // text template
  readonly template = signal(loadTemplate().template);
  readonly separator = signal<Separator>(loadTemplate().separator);

  readonly parsed = computed(() => parseIpList(this.ipText()));
  readonly canRun = computed(() => !this.loading() && this.parsed().valid.length > 0 && this.apiKey().trim().length > 0);

  readonly groups = computed(() => {
    const all = this.results() ?? [];
    const level = (r: IpCheckResult) => riskOf(r.abuseConfidenceScore);
    return {
      all,
      high: all.filter(r => level(r) === 'high'),
      suspicious: all.filter(r => level(r) === 'suspicious'),
      clean: all.filter(r => level(r) === 'low' || level(r) === 'clean')
    } satisfies Record<ResultFilter, IpCheckResult[]>;
  });

  readonly visible = computed(() => {
    const list = [...this.groups()[this.filter()]];
    if (this.sort() === 'score') list.sort((a, b) => b.abuseConfidenceScore - a.abuseConfidenceScore);
    if (this.sort() === 'reports') list.sort((a, b) => b.totalReports - a.totalReports);
    return list;
  });

  readonly selected = computed(() => this.results()?.find(r => r.ipAddress === this.selectedIp()) ?? null);

  readonly templateContext = computed(() => ({ maxAgeInDays: this.checkedWindow(), checkedAt: this.checkedAt() }));

  readonly outputText = computed(() => renderResults(this.template(), this.separator(), this.visible(), this.templateContext()));

  run(): void {
    if (!this.canRun()) return;
    const { valid, invalid } = this.parsed();
    const order = new Map(valid.map((ip, i) => [ip, i]));

    this.sub?.unsubscribe();
    this.loading.set(true);
    this.results.set([]);
    this.failed.set([]);
    this.skipped.set(invalid);
    this.filter.set('all');
    this.selectedIp.set(null);
    this.progress.set({ done: 0, total: valid.length });
    this.checkedAt.set(new Date());
    this.checkedWindow.set(this.maxAgeInDays());
    this.checkedVerbose.set(this.verbose());

    this.sub = this.client
      .checkMany(valid, this.apiKey().trim(), { maxAgeInDays: this.maxAgeInDays(), verbose: this.verbose() })
      .subscribe({
        next: item => {
          this.progress.update(p => ({ ...p, done: p.done + 1 }));
          if (item.ok) {
            if (item.rateLimit) this.rateLimit.set(item.rateLimit);
            this.results.update(list =>
              [...(list ?? []), item.result].sort((a, b) => order.get(a.ipAddress)! - order.get(b.ipAddress)!)
            );
          } else {
            this.failed.update(list => [...list, { ipAddress: item.ipAddress, message: item.message }]);
          }
        },
        complete: () => {
          this.loading.set(false);
          const top = [...(this.results() ?? [])].sort((a, b) => b.abuseConfidenceScore - a.abuseConfidenceScore)[0];
          this.selectedIp.set(top?.ipAddress ?? null);
        }
      });
  }

  clear(): void {
    this.sub?.unsubscribe();
    this.loading.set(false);
    this.ipText.set('');
    this.results.set(null);
    this.failed.set([]);
    this.skipped.set([]);
    this.selectedIp.set(null);
  }

  saveTemplate(template: string, separator: Separator): void {
    this.template.set(template);
    this.separator.set(separator);
    this.view.set('text');
    try { localStorage.setItem(TEMPLATE_KEY, JSON.stringify({ template, separator })); } catch { /* ignore */ }
  }

  exportCsv(): void {
    const cols: [string, (r: IpCheckResult) => unknown][] = [
      ['ipAddress', r => r.ipAddress], ['abuseConfidenceScore', r => r.abuseConfidenceScore],
      ['countryCode', r => r.countryCode], ['isp', r => r.isp], ['domain', r => r.domain],
      ['usageType', r => r.usageType], ['isTor', r => r.isTor], ['isWhitelisted', r => r.isWhitelisted],
      ['totalReports', r => r.totalReports], ['numDistinctUsers', r => r.numDistinctUsers], ['lastReportedAt', r => r.lastReportedAt]
    ];
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = [cols.map(c => c[0]).join(','), ...this.visible().map(r => cols.map(c => esc(c[1](r))).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abuseipdb-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
