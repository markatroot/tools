import { ChangeDetectionStrategy, Component, model } from '@angular/core';

@Component({
  selector: 'ip-fluent-switch',
  template: `
    <label>
      <input type="checkbox" role="switch" [checked]="checked()" (change)="checked.set(!checked())" />
      <span class="track"><span class="knob"></span></span>
      <span class="text"><ng-content /></span>
    </label>
  `,
  styleUrl: './fluent-switch.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FluentSwitch {
  readonly checked = model(false);
}
