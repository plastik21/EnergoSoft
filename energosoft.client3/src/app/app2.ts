import {
  AsyncPipe,
  DatePipe
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  map,
  Observable,
  share,
  switchMap,
  finalize,
  startWith,
  distinctUntilChanged,
  tap,
  Subject,
  defer,
  shareReplay
} from 'rxjs';

import {
  TuiRoot,
  TuiLoader,
  TuiTextfield,
  TuiLabel,
  TuiButton,
  TuiDropdown,
  TuiDataList
} from '@taiga-ui/core';

import {
  TuiCheckbox,
  TuiChevron,
  TuiSelect,
  TuiDataListWrapper
} from '@taiga-ui/kit'

import {
  TuiTable,
  TuiSortDirection,
  TuiSortChange,
  TuiTablePagination,
  type TuiTablePaginationEvent
} from '@taiga-ui/addon-table';

import {
  TuiStringHandler
} from '@taiga-ui/cdk/types';

import {
  HistoryDto,
  HistoryListDto2,
  HistoryFilters
} from './history.dto'

import { HistoryService } from './history.service'

interface ColumnDef {
  id: keyof HistoryDto,
  label: string
}

const STORAGE_KEY = 'table_settings_v1';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    AsyncPipe,
    DatePipe,
    TuiRoot,
    TuiLoader,
    TuiTable,
    TuiTablePagination,
    TuiTextfield,
    TuiLabel,
    TuiCheckbox,
    TuiButton,
    TuiChevron,
    TuiSelect,
    TuiDataListWrapper,
    TuiDropdown,
    TuiDataList,
    ReactiveFormsModule
  ],
  templateUrl: './app2.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App2 {

  constructor() {

    // Подписка на изменение видимости столбцов
    this.visibleColumnsGroup.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed()
    ).subscribe(() => this.saveSettings());

    // Подписка на изменение размеров столбцов
    this.resize$.pipe(
      debounceTime(500),
      takeUntilDestroyed()
    ).subscribe(() => this.saveSettings());
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  private readonly historyService: HistoryService = inject(HistoryService);

  protected readonly columns: ColumnDef[] = [
    { id: 'id', label: 'ID' },
    { id: 'text', label: 'Текст' },
    { id: 'userFullName', label: 'ФИО пользователя' },
    { id: 'date', label: 'Дата' },
    { id: 'eventTypeName', label: 'Название типа события' },
  ];

  protected columnWidths: Record<string, number> = {};

  protected readonly filtersGroup = new FormGroup(
    this.columns.reduce((acc, col) => {
      acc[col.id] = new FormControl('');
      return acc;
    }, {} as Record<string, FormControl>)
  );

  protected readonly visibleColumnsGroup = new FormGroup(
    this.columns.reduce((acc, col) => {
      acc[col.id] = new FormControl(col.id != 'id');
      return acc;
    }, {} as Record<string, FormControl>)
  );

  protected readonly groupKeyControl = new FormControl<keyof HistoryDto>('id');

  protected get visibleColumnIds(): string[] {
    const visibleIds = this.columns
      .filter(col => this.visibleColumnsGroup.get(col.id)?.value)
      .map(col => col.id);

    return ['children', ...visibleIds];
  }

  protected get visibleColumns(): ColumnDef[] {
    let visibleColumnIds = this.visibleColumnIds;
    return this.columns.filter(col => visibleColumnIds.includes(col.id));
  }

  // Преобразуем id столбца в label
  protected readonly getColumnLabelById: TuiStringHandler<string> = (id) =>
    this.columns.find((item) => item.id === id)?.label ?? '';

  protected readonly page$ = new BehaviorSubject(0);
  protected readonly size$ = new BehaviorSubject(10);
  protected readonly sortKey$ = new BehaviorSubject<keyof HistoryDto>('id');
  protected readonly direction$ = new BehaviorSubject<TuiSortDirection>(TuiSortDirection.Asc);
  protected readonly groupKey$ = new BehaviorSubject<keyof HistoryDto>('id');
  protected readonly isLoading$ = new BehaviorSubject(true);
  protected readonly resize$ = new Subject<{ id: string; width: number }>();

  // defer гарантирует, что поток filters$ создастся только тогда, когда на него подпишется combineLatest в request$
  // К этому моменту loadSettings() уже отработал и заполнил this.filtersGroup.value
  protected readonly filters$ = defer(() =>
    this.filtersGroup.valueChanges.pipe(
      startWith(this.filtersGroup.value)
    )
  ).pipe(
    debounceTime(3000),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
    tap(() => this.rowState = {})
  );

  protected readonly request$ = combineLatest([
    this.sortKey$,
    this.direction$,
    this.page$,
    this.size$,
    this.filters$,
    this.groupKey$
  ]).pipe(
    // Микрозадержка для синхронизации потоков
    debounceTime(0),
    // Сохраняем текущие настройки
    tap(() => this.saveSettings()),
    // Маппим потоки
    switchMap(([sortKey, direction, page, size, filters, groupKey]) =>
      this.getData(
        sortKey,
        direction,
        page,
        size,
        filters as HistoryFilters,
        groupKey)),
    // Запоминаем последнее пришедшее значение и
    // сразу отдаем его любому новому подписчику
    shareReplay(1)
  );

  protected readonly data$ = this.request$.pipe(map(x => x?.items ?? []));
  protected readonly total$ = this.request$.pipe(map(x => x?.totalCount ?? 0));

  protected onSortChange(e: TuiSortChange<HistoryDto>) {
    this.sortKey$.next(e.sortKey!);
    this.direction$.next(e.sortDirection);
  }

  protected onColumnResize(id: string, width: number): void {
    this.columnWidths = {
      ...this.columnWidths,
      [id]: width
    };
    this.resize$.next({ id, width });
  }

  protected onPagination(e: TuiTablePaginationEvent) {
    this.rowState = {};
    this.page$.next(e.page);
    this.size$.next(e.size);
  }

  protected onGroupChange(id: keyof HistoryDto): void {
    this.rowState = {};
    this.groupKey$.next(id);
  }

  // Состояние развёрнутости групп
  protected rowState: Record<number, boolean> = {};

  protected toggleRow(index: number): void {
    this.rowState[index] = !this.rowState[index];
  }

  private getData(
    sortKey: keyof HistoryDto,
    direction: TuiSortDirection,
    page: number,
    size: number,
    filters: HistoryFilters,
    groupKey: keyof HistoryDto): Observable<HistoryListDto2> {

    try {

      this.isLoading$.next(true);

      return this.historyService.getGroupedHistory(
        sortKey,
        direction == TuiSortDirection.Desc,
        page,
        size,
        filters,
        groupKey).pipe(
          finalize(() => this.isLoading$.next(false))
        );
    }
    catch (err) {
      console.error(err);
      this.isLoading$.next(false);
      return {} as Observable<HistoryListDto2>;
    }
  }

  private loadSettings(): void {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {

      const s = JSON.parse(saved);

      if (s.filters) {
        this.filtersGroup.patchValue(s.filters, { emitEvent: false });
      }

      if (s.visibleColumns) {
        this.visibleColumnsGroup.patchValue(s.visibleColumns, { emitEvent: false });
      }

      if (s.sortKey) {
        this.sortKey$.next(s.sortKey);
      }

      if (s.direction) {
        this.direction$.next(s.direction);
      }

      if (s.groupKey) {
        this.groupKey$.next(s.groupKey);
        this.groupKeyControl.setValue(s.groupKey, { emitEvent: false });
      }

      if (s.size) {
        this.size$.next(s.size);
      }

      if (s.page) {
        this.page$.next(s.page);
      }

      if (s.columnWidths) {
        this.columnWidths = s.columnWidths;
      }

    } catch (e) {
      console.error('Не удалось загрузить настройки таблицы:', e);
    }
  }

  private saveSettings(): void {

    const settings = {
      filters: this.filtersGroup.value,
      visibleColumns: this.visibleColumnsGroup.value,
      sortKey: this.sortKey$.value,
      direction: this.direction$.value,
      groupKey: this.groupKey$.value,
      size: this.size$.value,
      page: this.page$.value,
      columnWidths: this.columnWidths
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
