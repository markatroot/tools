import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { IpCheckResult } from '../../models';
import { ScoreBar } from '../score-bar/score-bar';
import { TimeAgoPipe } from '../time-ago.pipe';

@Component({
  selector: 'ip-results-table',
  imports: [ScoreBar, TimeAgoPipe],
  templateUrl: './results-table.html',
  styleUrl: './results-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsTable {
  readonly results = input.required<IpCheckResult[]>();
  readonly selectedIp = model<string | null>(null);

  protected readonly rows = computed(() =>
    this.results().map((r) => ({
      r,
      flags: [
        !r.isPublic && 'Private',
        r.isTor && 'Tor exit',
        r.isWhitelisted && 'Whitelisted',
        r.ipVersion === 6 && 'IPv6',
      ].filter((x): x is string => !!x),
    })),
  );
}
