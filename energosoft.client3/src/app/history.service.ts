import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, retry } from 'rxjs';
import { HistoryDto, HistoryListDto } from './history.dto'

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/history/list';

  public getHistory(
    sortKey: keyof HistoryDto,
    sortDesc: boolean,
    page: number,
    size: number): Observable<HistoryListDto> {

    let params = new HttpParams();

    params = params
      .set('page', page)
      .set('size', size)
      .set('text', '')
      .set('user', '')
      .set('event', '')
      .set('sort', sortKey)
      .set('desc', sortDesc);

    return this.http.get<HistoryListDto>(this.apiUrl, { params: params }).pipe(retry({ count: 3, delay: 2000, resetOnSuccess: true }));
  }
}
