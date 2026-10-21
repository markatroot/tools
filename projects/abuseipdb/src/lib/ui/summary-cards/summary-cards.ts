import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { IpCheckResult } from '../../models';
import { ResultFilter } from '../../risk';

@Component({
  selector: 'ip-summary-cards',
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCards {
  readonly groups = input.required<Record<ResultFilter, IpCheckResult[]>>();
  readonly filter = model<ResultFilter>('all');

  protected readonly cards = computed(() => {
    const g = this.groups();
    return [
      { key: 'all' as const, label: 'Addresses checked', count: g.all.length },
      {
        key: 'high' as const,
        label: 'High risk (75–100)',
        count: g.high.length,
      },
      {
        key: 'suspicious' as const,
        label: 'Suspicious (25–74)',
        count: g.suspicious.length,
      },
      {
        key: 'clean' as const,
        label: 'Low or clean (0–24)',
        count: g.clean.length,
      },
    ];
  });
}
