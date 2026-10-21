import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { riskOf } from '../../risk';
import { RiskBadge } from '../risk-badge/risk-badge';

@Component({
  selector: 'ip-score-bar',
  imports: [RiskBadge],
  template: `
    <div class="row">
      <span class="num">{{ score() }}</span>
      <div class="track"><div class="fill" [class]="level()" [style.width.%]="score()"></div></div>
    </div>
    <ip-risk-badge [score]="score()" />
  `,
  styleUrl: './score-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreBar {
  readonly score = input.required<number>();
  protected readonly level = computed(() => riskOf(this.score()));
}
