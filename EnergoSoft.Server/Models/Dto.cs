namespace EnergoSoft.Server
{
    using Microsoft.AspNetCore.Mvc;

    // DTO истории
    public record HistoryDto
    (
        int Id,
        string? Text,
        DateTime Date,
        string UserFullName,
        string EventTypeName
    );

    // DTO запроса истории
    public record HistoryListRequestDto
    (
        [FromQuery(Name = "page")] int PageNumber = 0,
        [FromQuery(Name = "size")] int PageSize = 0,
        [FromQuery(Name = "text")] string? Text = default,
        [FromQuery(Name = "user")] string? UserFullName = default,
        [FromQuery(Name = "date_from")] DateTime? DateFrom = default,
        [FromQuery(Name = "date_to")] DateTime? DateTo = default,
        [FromQuery(Name = "event")] string? EventTypeName = default,
        [FromQuery(Name = "sort")] string? SortBy = default,
        [FromQuery(Name = "desc")] bool IsDescending = false,
        [FromQuery(Name = "group")] string? GroupBy = default
    );

    // DTO ответа на запрос истории
    public record HistoryListResponseDto
    (
        IEnumerable<HistoryDto> Items,
        int TotalCount,
        int PageNumber,
        int PageSize
    );

    public record HistoryGroupedItem
    (
        HistoryDto Root,
        HistoryDto[] Children
    );

    public record HistoryListResponseDto2
    (
        HistoryGroupedItem[] Items,
        int TotalCount,
        int PageNumber,
        int PageSize
    );
}
