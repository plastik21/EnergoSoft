import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry } from 'rxjs';
import { HistoryDto, HistoryListDto, HistoryListDto2 } from './history.dto'

export interface HistoryFilters {
  id: number | null,
  text: string | null,
  date: Date | null,
  userFullName: string | null,
  eventTypeName: string | null
}

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/history/list';
  private readonly apiUrl2 = '/api/history/list2';

  public getHistory(
    sortKey: keyof HistoryDto,
    sortDesc: boolean,
    page: number,
    size: number,
    filters: HistoryFilters): Observable<HistoryListDto> {

    let params = new HttpParams();

    params = params
      .set('page', page)
      .set('size', size)
      .set('text', filters.text ?? '')
      .set('user', filters.userFullName ?? '')
      .set('event', filters.eventTypeName ?? '')
      .set('sort', sortKey)
      .set('desc', sortDesc);

    return this.http.get<HistoryListDto>(this.apiUrl, { params: params }).pipe(retry({ count: 3, delay: 2000, resetOnSuccess: true }));
  }

  public getGroupedHistory(
    sortKey: keyof HistoryDto,
    sortDesc: boolean,
    page: number,
    size: number,
    filters: HistoryFilters): Observable<HistoryListDto2> {

    let params = new HttpParams();

    params = params
      .set('page', page)
      .set('size', size)
      .set('text', filters.text ?? '')
      .set('user', filters.userFullName ?? '')
      .set('event', filters.eventTypeName ?? '')
      .set('sort', sortKey)
      .set('desc', sortDesc);

    return this.http.get<HistoryListDto2>(this.apiUrl2, { params: params }).pipe(retry({ count: 3, delay: 2000, resetOnSuccess: true }));
  }  
}
