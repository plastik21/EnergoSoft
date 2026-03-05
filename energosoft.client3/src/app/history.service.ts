import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoryDto, HistoryListDto } from './history.dto'

@Injectable({ providedIn: 'root' })
export class HistoryService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/history/list';

  public getHistory(sortKey: keyof HistoryDto, sortDesc: boolean): Observable<HistoryListDto> {

    let params = new HttpParams();

    params = params
      .set('page', 1)
      .set('limit', 10)
      .set('text', '')
      .set('user', '')
      .set('event', '')
      .set('sort', sortKey)
      .set('desc', sortDesc);

    return this.http.get<HistoryListDto>(this.apiUrl, { params: params });
  }
}
