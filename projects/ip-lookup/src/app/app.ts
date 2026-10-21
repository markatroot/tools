import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LookupPage } from './features/lookup/lookup-page';
import { LookupStore } from './features/lookup/lookup.store';

@Component({
  selector: 'ip-root',
  imports: [LookupPage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly store = inject(LookupStore);
}
