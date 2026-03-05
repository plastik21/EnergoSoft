import { AsyncPipe, DatePipe } from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  delay,
  filter,
  map,
  Observable,
  of,
  share,
  startWith,
  switchMap
} from 'rxjs';

import {
  TuiTable,
  TuiSortDirection,
  TuiSortChange
} from '@taiga-ui/addon-table';

import { HistoryDto, } from './history.dto'
import { HistoryService } from './history.service'

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    AsyncPipe,    
    TuiTable,
    DatePipe
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {

  protected readonly historyService: HistoryService = inject(HistoryService);
  protected readonly columns: Array<keyof HistoryDto> = ['id', 'text', 'userFullName', 'date', 'eventTypeName'];

  protected readonly sortKey$ = new BehaviorSubject<keyof HistoryDto>('id');
  protected readonly direction$ = new BehaviorSubject<TuiSortDirection>(TuiSortDirection.Desc);  

  protected readonly request$ = combineLatest([
    this.sortKey$,
    this.direction$
  ]).pipe(
    // zero time debounce for a case when both key and direction change
    debounceTime(0),
    switchMap((query) => this.getData(...query)),
    share()
  );

  protected onSortChange(e: TuiSortChange<HistoryDto>): void {
    this.sortKey$.next(e.sortKey!);
    this.direction$.next(e.sortDirection);
  }

  private getData(sortKey: keyof HistoryDto, direction: TuiSortDirection): Observable<HistoryDto[]> {
    try {      
      return this.historyService.getHistory(sortKey, direction == TuiSortDirection.Desc).pipe(map((x) => x.items || []));
    }
    catch (err) {
      console.error(err);
      return of([]);
    }
  }
}
