
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
