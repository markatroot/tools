import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ApiKeyField } from '../../shared/api-key-field/api-key-field';
import { IpListInput } from '../../shared/ip-list-input/ip-list-input';
import { FluentSwitch } from '../../shared/fluent-switch/fluent-switch';
import { LookupStore, ResultSort } from './lookup.store';
import {
  IpDetailPanel,
  ResultFilter,
  ResultsTable,
  SEPARATORS,
  Separator,
  SummaryCards,
  TemplateEditor,
  TextOutput,
  templateLabel,
} from '@ip-tools/abuseipdb';

const FILTER_TITLES: Record<ResultFilter, string> = {
  all: 'All results',
  high: 'High risk',
  suspicious: 'Suspicious',
  clean: 'Low or clean',
};

@Component({
  selector: 'ip-lookup-page',
  imports: [
    ApiKeyField,
    IpListInput,
    FluentSwitch,
    SummaryCards,
    ResultsTable,
    TextOutput,
    IpDetailPanel,
    TemplateEditor,
  ],
  templateUrl: './lookup-page.html',
  styleUrl: './lookup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LookupPage {
  protected readonly store = inject(LookupStore);
  protected readonly editorOpen = signal(false);
  protected readonly windows = [30, 90, 180, 365];

  protected readonly runLabel = computed(() => {
    if (this.store.loading()) {
      const p = this.store.progress();
      return 'Checking ' + p.done + ' of ' + p.total + '…';
    }
    const n = this.store.parsed().valid.length;
    return n > 1 ? 'Check ' + n + ' addresses' : 'Check address';
  });

  protected readonly resultsTitle = computed(
    () =>
      FILTER_TITLES[this.store.filter()] +
      ' (' +
      this.store.visible().length +
      ')',
  );

  protected readonly skippedText = computed(() => {
    const s = this.store.skipped();
    return (
      'Skipped ' +
      s.length +
      ' invalid ' +
      (s.length > 1 ? 'entries' : 'entry') +
      ': ' +
      s.join(', ')
    );
  });

  protected readonly templateSummary = computed(
    () =>
      templateLabel(this.store.template()) +
      ' · ' +
      SEPARATORS[this.store.separator()].label.toLowerCase() +
      ' between results',
  );

  protected readonly previewResults = computed(() => {
    const sel = this.store.selected();
    const rest = (this.store.results() ?? []).filter((r) => r !== sel);
    return (sel ? [sel, ...rest] : rest).slice(0, 2);
  });

  protected onDays(e: Event): void {
    this.store.maxAgeInDays.set(Number((e.target as HTMLSelectElement).value));
  }

  protected onSort(e: Event): void {
    this.store.sort.set((e.target as HTMLSelectElement).value as ResultSort);
  }

  protected saveTemplate(v: { template: string; separator: Separator }): void {
    this.store.saveTemplate(v.template, v.separator);
    this.editorOpen.set(false);
  }
}
