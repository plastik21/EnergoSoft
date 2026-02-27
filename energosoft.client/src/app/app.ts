import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BehaviorSubject, combineLatest, debounceTime, shareReplay, switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush // Рекомендуется для Taiga UI
})
export class App {
  readonly columns = ['id', 'text', 'fio', 'date', 'typeName'];

  // Состояние таблицы (RxJS потоки)
  readonly refresh$ = new BehaviorSubject<void>(undefined);
  readonly page$ = new BehaviorSubject(0);
  readonly size$ = new BehaviorSubject(10);
  readonly sorter$ = new BehaviorSubject<string>('id');
  readonly direction$ = new BehaviorSubject<-1 | 1>(1);

  // Объект фильтров (связан с инпутами в HTML)
  filters = { id: '', text: '', fio: '' };

  // Основной поток данных: следит за изменениями всех параметров выше
  readonly data$ = combineLatest([
    this.refresh$, this.page$, this.size$, this.sorter$, this.direction$
  ]).pipe(
    debounceTime(300), // Пауза 300мс при вводе фильтров
    switchMap(([_, page, size, sort, dir]) => {
      const params = new HttpParams()
        .set('page', page)
        .set('size', size)
        .set('sortField', sort)
        .set('descending', dir === -1)
        .set('filterId', this.filters.id)
        .set('filterText', this.filters.text)
        .set('filterFio', this.filters.fio);

      // Запрос к вашему .NET контроллеру
      return this.http.get<{ items: any[], total: number }>('/api/events', { params });
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) { }

  onFilterChange() {
    this.page$.next(0); // При новом поиске сбрасываем на 1-ю страницу
    this.refresh$.next();
  }
}
