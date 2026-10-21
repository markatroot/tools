import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RISK_LABELS, riskOf } from '../../risk';

@Component({
  selector: 'ip-risk-badge',
  template: '{{ label() }}',
  styleUrl: './risk-badge.scss',
  host: { '[class]': 'level()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiskBadge {
  readonly score = input.required<number>();
  protected readonly level = computed(() => riskOf(this.score()));
  protected readonly label = computed(() => RISK_LABELS[this.level()]);
}
