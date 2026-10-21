import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { ParsedIpList, segmentIpText } from '@ip-tools/abuseipdb';

/** Textarea with inline valid/invalid colouring (mirror layer behind a transparent textarea). */
@Component({
  selector: 'ip-ip-list-input',
  templateUrl: './ip-list-input.html',
  styleUrl: './ip-list-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpListInput {
  readonly text = model('');
  readonly parsed = input.required<ParsedIpList>();
  readonly minRows = input(8);

  protected readonly segments = computed(() => segmentIpText(this.text()));
  protected readonly rows = computed(() =>
    Math.max(this.minRows(), this.text().split('\n').length + 1),
  );

  protected onInput(e: Event): void {
    this.text.set((e.target as HTMLTextAreaElement).value);
  }
}
