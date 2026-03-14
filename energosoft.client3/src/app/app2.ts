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
  distinctUntilChanged,
  tap
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
  HistoryDto,
  HistoryListDto2,
  HistoryFilters
} from './history.dto'

import { HistoryService } from './history.service'
import { TuiStringHandler } from '@taiga-ui/cdk/types';

interface ColumnDef {
  id: keyof HistoryDto,
  label: string
}

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

  private readonly historyService: HistoryService = inject(HistoryService);

  protected readonly columns: ColumnDef[] = [
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

  protected readonly groupKeyControl = new FormControl<keyof HistoryDto>('id');

  protected get visibleColumnIds(): string[] {
    const visibleIds = this.columns
      .filter(col => this.showColumnsGroup.get(col.id)?.value)
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

  protected readonly filters$ = this.filtersGroup.valueChanges.pipe(
    startWith(this.filtersGroup.value),
    debounceTime(500),
    tap(() => this.rowState = {}),
    distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
  );

  protected readonly request$ = combineLatest([
    this.sortKey$,
    this.direction$,
    this.page$,
    this.size$,
    this.filters$,
    this.groupKey$
  ]).pipe(
    // zero time debounce for a case when both key and direction change
    debounceTime(0),
    switchMap(([sortKey, direction, page, size, filters, groupKey]) =>
      this.getData(
        sortKey,
        direction,
        page,
        size,
        filters as HistoryFilters,
        groupKey)),
    share()
  );

  protected readonly data$ = this.request$.pipe(map(x => x?.items ?? []));
  protected readonly total$ = this.request$.pipe(map(x => x?.totalCount ?? 0));

  protected onSortChange(e: TuiSortChange<HistoryDto>) {
    this.sortKey$.next(e.sortKey!);
    this.direction$.next(e.sortDirection);
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
        groupKey).pipe(finalize(() => this.isLoading$.next(false)));
    }
    catch (err) {
      console.error(err);
      this.isLoading$.next(false);
      return {} as Observable<HistoryListDto2>;
    }
  }
}
