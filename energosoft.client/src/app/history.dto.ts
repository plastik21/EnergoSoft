
import {
  TuiDayRange
} from '@taiga-ui/cdk';

export interface HistoryDto {
  id: number,
  text: string,
  date: Date,
  userFullName: string,
  eventTypeName: string
}

export interface HistoryGroupedItem {
  root: HistoryDto,
  children: HistoryDto[]
}

export interface HistoryListDto {
  items: HistoryGroupedItem[],
  totalCount: number,
  pageNumber: number,
  pageSize: number
}

export interface HistoryFilters {
  id: number | null,
  text: string | null,
  date: TuiDayRange | null,
  userFullName: string | null,
  eventTypeName: string | null
}
