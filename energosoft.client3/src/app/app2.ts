import { AsyncPipe, DatePipe } from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

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
  distinctUntilChanged
} from 'rxjs';

import {
  TuiRoot,
  TuiLoader,
  TuiTextfield,
  TuiLabel,
  TuiButton
} from '@taiga-ui/core';

import {
  TuiCheckbox,
  TuiChevron
} from '@taiga-ui/kit'

import {
  TuiTable,
  TuiSortDirection,
  TuiSortChange,
  TuiTablePagination,
  type TuiTablePaginationEvent
} from '@taiga-ui/addon-table';

import {
  HistoryDto,
  HistoryListDto2,
  HistoryFilters
} from './history.dto'

import { HistoryService } from './history.service'

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
    ReactiveFormsModule
  ],
  templateUrl: './app2.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App2 {

  private readonly historyService: HistoryService = inject(HistoryService);

  protected readonly columns: { id: string, label: string }[] = [
    { id: 'children', label: '' },
    { id: 'id', label: 'ID' },
    { id: 'text', label: 'Текст' },
    { id: 'userFullName', label: 'ФИО пользователя' },
    { id: 'date', label: 'Дата' },
    { id: 'eventTypeName', label: 'Название типа события' },
  ];

  protected readonly filtersGroup = new FormGroup(
    this.columns.reduce((acc, col) => {
      acc[col.id] = new FormControl('');
      return acc;
    }, {} as Record<string, FormControl>)
  );

  protected readonly showColumnsGroup = new FormGroup(
    this.columns.reduce((acc, col) => {
      acc[col.id] = new FormControl(col.id != 'id');
      return acc;
    }, {} as Record<string, FormControl>)
  );

  protected get visibleColumnIds(): string[] {
    return this.columns
      .filter(col => this.showColumnsGroup.get(col.id)?.value)
      .map(col => col.id);
  }

  protected get visibleColumns(): { id: string, label: string }[] {
    let visibleColumnIds = this.visibleColumnIds;
    return this.columns.filter(col => visibleColumnIds.includes(col.id));
  }

  protected readonly page$ = new BehaviorSubject(0);
  protected readonly size$ = new BehaviorSubject(10);
  protected readonly sortKey$ = new BehaviorSubject<keyof HistoryDto>('id');
  protected readonly direction$ = new BehaviorSubject<TuiSortDirection>(TuiSortDirection.Asc);
  protected readonly isLoading$ = new BehaviorSubject(true);

  protected readonly filters$ = this.filtersGroup.valueChanges.pipe(
    startWith(this.filtersGroup.value),
    debounceTime(500), // Задержка только для ввода текста
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  protected readonly request$ = combineLatest([
    this.sortKey$,
    this.direction$,
    this.page$,
    this.size$,
    this.filters$
  ]).pipe(
    // zero time debounce for a case when both key and direction change
    debounceTime(0),
    switchMap(([sortKey, direction, page, size, filters]) => this.getData(sortKey, direction, page, size, filters as HistoryFilters)),
    share()
  );

  protected readonly data$ = this.request$.pipe(map(x => x?.items ?? []));
  protected readonly total$ = this.request$.pipe(map(x => x?.totalCount ?? 0));

  protected onSortChange(e: TuiSortChange<HistoryDto>) {
    this.sortKey$.next(e.sortKey!);
    this.direction$.next(e.sortDirection);
  }

  protected onPagination(e: TuiTablePaginationEvent) {
    this.page$.next(e.page);
    this.size$.next(e.size);
  }

  // Состояние развёрнутости группы
  protected readonly rowState: Record<number, boolean> = {};

  protected toggleRow(index: number): void {
    this.rowState[index] = !this.rowState[index];
  }

  private getData(
    sortKey: keyof HistoryDto,
    direction: TuiSortDirection,
    page: number,
    size: number,
    filters: HistoryFilters): Observable<HistoryListDto2> {

    try {

      this.isLoading$.next(true);

      return this.historyService.getGroupedHistory(
        sortKey,
        direction == TuiSortDirection.Desc,
        page,
        size,
        filters,
        'userFullName').pipe(finalize(() => this.isLoading$.next(false)));
    }
    catch (err) {
      console.error(err);
      this.isLoading$.next(false);
      return {} as Observable<HistoryListDto2>;
    }
  }
}
