import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TuiRoot, TuiTextfield } from '@taiga-ui/core';
import { TuiDataListWrapper, TuiSelect } from '@taiga-ui/kit';
import { TuiTable, TuiTablePagination } from '@taiga-ui/addon-table';

interface EventLog {
  id: number;
  text: string;
  fio: string;
  date: string;
  type: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiRoot,
    TuiTable,
    TuiTablePagination,
    TuiTextfield,
    TuiSelect,
    TuiDataListWrapper
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

  readonly columns = ['id', 'text', 'fio', 'date', 'type'];

  data: EventLog[] = [
    { id: 1, text: 'Вход в систему', fio: 'Иванов И.И.', date: '2023-10-01', type: 'Инфо' },
    { id: 2, text: 'Ошибка доступа', fio: 'Петров П.П.', date: '2023-10-02', type: 'Ошибка' },
    { id: 3, text: 'Изменение настроек', fio: 'Сидоров С.С.', date: '2023-10-03', type: 'Предупреждение' }    
  ];

  sorter = 'id';
  direction = 1; // 1 - asc, -1 - desc
  size = 10;
  page = 0;

  searchFio = '';

  get filteredData(): EventLog[] {
    return this.data
      .filter(item => item.fio.toLowerCase().includes(this.searchFio.toLowerCase()))
      .slice(this.page * this.size, (this.page + 1) * this.size);
  }

  readonly total = this.data.length;
}
