import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'ip-text-output',
  templateUrl: './text-output.html',
  styleUrl: './text-output.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextOutput {
  readonly text = input.required<string>();
  readonly count = input(0);
  protected readonly copied = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  protected async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.text());
    this.copied.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), 1500);
  }
}
