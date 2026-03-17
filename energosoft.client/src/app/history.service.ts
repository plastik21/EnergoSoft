import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry } from 'rxjs';
import { HistoryDto, HistoryListDto, HistoryFilters } from './history.dto'

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  public getHistory(
    sortKey: keyof HistoryDto,
    sortDesc: boolean,
    page: number,
    size: number,
    filters: HistoryFilters,
    groupKey: keyof HistoryDto): Observable<HistoryListDto> {

    const url = this.apiUrl + '/history/list';

    let params = new HttpParams()    
      .set('page', page)
      .set('size', size)
      .set('sort', sortKey)
      .set('desc', sortDesc)
      .set('group', groupKey);

    if (filters.text) {
      params = params.set('text', filters.text);
    }

    if (filters.userFullName) {
      params = params.set('user', filters.userFullName);
    }

    if (filters.date) {

      let dateFrom = filters.date.from.toLocalNativeDate();
      let dateTo = filters.date.to.toLocalNativeDate();

      params = params
        .set('date_from', dateFrom.toISOString())
        .set('date_to', dateTo.toISOString());
    }

    if (filters.eventTypeName) {
      params = params.set('event', filters.eventTypeName);
    }

    return this.http.get<HistoryListDto>(url, { params: params }).pipe(retry({ count: 3, delay: 2000, resetOnSuccess: true }));
  }
}
