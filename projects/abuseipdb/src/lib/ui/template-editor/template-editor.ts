import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { IpCheckResult } from '../../models';
import {
  SAMPLE_RESULT,
  SEPARATORS,
  Separator,
  TEMPLATE_PRESETS,
  TEMPLATE_VARIABLES,
  TemplateContext,
  buildTemplateVars,
  findUnknownVariables,
  renderResults,
  segmentTemplate,
} from '../../text-template';

@Component({
  selector: 'ip-template-editor',
  templateUrl: './template-editor.html',
  styleUrl: './template-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditor implements AfterViewInit {
  readonly template = input.required<string>();
  readonly separator = input.required<Separator>();
  readonly previewResults = input<IpCheckResult[]>([]);
  readonly context = input.required<TemplateContext>();

  readonly saved = output<{ template: string; separator: Separator }>();
  readonly closed = output<void>();

  private readonly injector = inject(Injector);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly textarea =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('tpl');

  protected readonly draft = linkedSignal(() => this.template());
  protected readonly draftSeparator = linkedSignal(() => this.separator());

  protected readonly presets = TEMPLATE_PRESETS;
  protected readonly separators = Object.entries(SEPARATORS) as [
    Separator,
    { label: string },
  ][];

  protected readonly segments = computed(() => segmentTemplate(this.draft()));
  protected readonly rows = computed(() =>
    Math.max(8, this.draft().split('\n').length + 1),
  );
  protected readonly unknown = computed(() =>
    findUnknownVariables(this.draft()),
  );

  /** Real results when there are any, otherwise a sample so the editor works before the first check. */
  protected readonly usingSample = computed(
    () => !this.previewResults().length,
  );
  private readonly samples = computed(() =>
    this.usingSample() ? [SAMPLE_RESULT] : this.previewResults(),
  );

  protected readonly variables = computed(() => {
    const vars = buildTemplateVars(this.samples()[0], this.context());
    return TEMPLATE_VARIABLES.map((v) => {
      const s = vars[v.name] ?? v.description;
      return {
        token: '{' + v.name + '}',
        sample: s.length > 22 ? s.slice(0, 21) + '…' : s,
        title: v.description,
      };
    });
  });

  protected readonly preview = computed(() =>
    renderResults(
      this.draft(),
      this.draftSeparator(),
      this.samples(),
      this.context(),
    ),
  );

  ngAfterViewInit(): void {
    this.dialog().nativeElement.showModal();
  }

  protected onInput(e: Event): void {
    this.draft.set((e.target as HTMLTextAreaElement).value);
  }

  protected onSeparator(e: Event): void {
    this.draftSeparator.set((e.target as HTMLSelectElement).value as Separator);
  }

  protected insert(token: string): void {
    const el = this.textarea().nativeElement;
    const start = el.selectionStart ?? this.draft().length;
    const end = el.selectionEnd ?? start;
    this.draft.update((d) => d.slice(0, start) + token + d.slice(end));
    afterNextRender(
      () => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      },
      { injector: this.injector },
    );
  }

  protected onDragStart(e: DragEvent, token: string): void {
    e.dataTransfer?.setData('text/plain', token);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  }

  protected reset(): void {
    this.draft.set(TEMPLATE_PRESETS[0].template);
    this.draftSeparator.set('blank');
  }

  protected save(): void {
    this.saved.emit({
      template: this.draft(),
      separator: this.draftSeparator(),
    });
  }

  protected onBackdropClick(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.closed.emit();
  }
}
