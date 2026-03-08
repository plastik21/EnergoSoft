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
  TuiLabel
} from '@taiga-ui/core';

import { TuiCheckbox } from '@taiga-ui/kit'

import {
  TuiTable,
  TuiSortDirection,
  TuiSortChange,
  TuiTablePagination,
  type TuiTablePaginationEvent
} from '@taiga-ui/addon-table';

import { HistoryDto, HistoryListDto } from './history.dto'
import { HistoryService, HistoryFilters } from './history.service'

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
    ReactiveFormsModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {

  private readonly historyService: HistoryService = inject(HistoryService);

  protected readonly columns = [
    { id: 'id', label: 'ID' },
    { id: 'text', label: 'Текст' },
    { id: 'userFullName', label: 'ФИО пользователя' },
    { id: 'date', label: 'Дата' },
    { id: 'eventTypeName', label: 'Название типа события' },
  ];

  protected readonly columnsControl = new FormGroup(
    this.columns.reduce((acc, col) => {
      acc[col.id] = new FormControl(col.id != 'id');
      return acc;
    }, {} as Record<string, FormControl>)
  );

  protected get visibleColumnIds(): string[] {
    return this.columns
      .filter(col => this.columnsControl.get(col.id)?.value)
      .map(col => col.id);
  }

  protected get visibleColumns(): { id: string, label: string }[] {
    return this.columns.filter(col => this.visibleColumnIds.includes(col.id));
  }

  protected readonly filters = new FormGroup({
    id: new FormControl(''),
    text: new FormControl(''),
    userFullName: new FormControl(''),
    date: new FormControl(''),
    eventTypeName: new FormControl('')
  });

  protected readonly page$ = new BehaviorSubject(0);
  protected readonly size$ = new BehaviorSubject(10);
  protected readonly sortKey$ = new BehaviorSubject<keyof HistoryDto>('id');
  protected readonly direction$ = new BehaviorSubject<TuiSortDirection>(TuiSortDirection.Asc);
  protected readonly isLoading$ = new BehaviorSubject(true);

  protected readonly filters$ = this.filters.valueChanges.pipe(
    startWith(this.filters.value),
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

  protected onSortChange(e: TuiSortChange<HistoryDto>): void {
    this.sortKey$.next(e.sortKey!);
    this.direction$.next(e.sortDirection);
  }

  protected onPagination(e: TuiTablePaginationEvent): void {
    this.page$.next(e.page);
    this.size$.next(e.size);
  }

  private getData(
    sortKey: keyof HistoryDto,
    direction: TuiSortDirection,
    page: number,
    size: number,
    filters: HistoryFilters): Observable<HistoryListDto> {

    try {

      this.isLoading$.next(true);

      return this.historyService.getHistory(
        sortKey,
        direction == TuiSortDirection.Desc,
        page,
        size,
        filters).pipe(finalize(() => this.isLoading$.next(false)));
    }
    catch (err) {
      console.error(err);
      this.isLoading$.next(false);
      return {} as Observable<HistoryListDto>;
    }
  }
}
