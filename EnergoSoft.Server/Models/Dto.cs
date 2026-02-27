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
        [FromQuery(Name = "page")] int PageNumber = 1,
        [FromQuery(Name = "limit")] int PageSize = 10,
        [FromQuery(Name = "text")] string? Text = default,
        [FromQuery(Name = "user")] string? UserFullName = default,
        [FromQuery(Name = "event")] string? EventTypeName = default,
        [FromQuery(Name = "sort")] string? SortBy = default,
        [FromQuery(Name = "desc")] bool IsDescending = false
    );

    // DTO ответа на запрос истории
    public record HistoryListResponseDto
    (
        IEnumerable<HistoryDto> Items,
        int TotalCount,
        int PageNumber,
        int PageSize
    );
}
