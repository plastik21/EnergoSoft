
export interface HistoryDto {
  id: number,
  text: string,
  date: Date,
  userFullName: string,
  eventTypeName: string
}

export interface HistoryListDto {
  items: HistoryDto[],
  totalCount: number,
  pageNumber: number,
  pageSize: number
}

export interface HistoryListDto2 {
  items: Array<HistoryDto[]>,
  totalCount: number,
  pageNumber: number,
  pageSize: number
}

export interface HistoryFilters {
  id: number | null,
  text: string | null,
  date: Date | null,
  userFullName: string | null,
  eventTypeName: string | null
}
