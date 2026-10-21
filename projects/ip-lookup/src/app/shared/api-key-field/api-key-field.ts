import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
} from '@angular/core';

@Component({
  selector: 'ip-api-key-field',
  templateUrl: './api-key-field.html',
  styleUrl: './api-key-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyField {
  readonly value = model('');
  protected readonly visible = signal(false);

  protected readonly status = computed(() => {
    const len = this.value().trim().length;
    if (!len) return { text: 'Required to run a check', tone: 'neutral' };
    if (len === 80) return { text: 'Key format looks valid', tone: 'success' };
    return {
      text: 'Keys are 80 characters (' + len + ' entered)',
      tone: 'warning',
    };
  });

  protected onInput(e: Event): void {
    this.value.set((e.target as HTMLInputElement).value);
  }
}
