namespace EnergoSoft.Server.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using System.Linq.Expressions;

    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private readonly EnergoSoftDbContext _context;

        public HistoryController(EnergoSoftDbContext context)
        {
            _context = context;
        }

        [HttpGet("list")]
        public async Task<HistoryListResponseDto> List([FromQuery] HistoryListRequestDto request)
        {
            // Базовый запрос
            var query = _context.Histories
                .Include(x => x.User)
                .Include(x => x.EventType)
                .AsQueryable();

            // Фильтр по Text
            if (!string.IsNullOrWhiteSpace(request.Text))
            {
                query = query.Where(x => EF.Functions.ILike(x.Text ?? string.Empty, $"%{request.Text}%"));
            }

            // Фильтр по UserFullName
            if (!string.IsNullOrWhiteSpace(request.UserFullName))
            {
                query = query.Where(x => EF.Functions.ILike(x.User.FullName ?? string.Empty, $"%{request.UserFullName}%"));
            }

            // Фильтр по EventTypeName
            if (!string.IsNullOrWhiteSpace(request.EventTypeName))
            {
                query = query.Where(x => EF.Functions.ILike(x.EventType.Name ?? string.Empty, $"%{request.EventTypeName}%"));
            }

            // Сортировка
            var sortColumns = new Dictionary<string, Expression<Func<History, object>>>
            {
                { "text", x => x.Text ?? string.Empty },
                { "user", x => x.User.FullName },
                { "event", x => x.EventType.Name },
                { "date", x => x.Date },
            };

            var sortBy = request.SortBy?.ToLower() ?? "date"; // По-умолчанию сортируем по дате

            if (!sortColumns.TryGetValue(sortBy, out var keySelector))
            {
                keySelector = sortColumns["date"];
            }

            query = request.IsDescending ? query.OrderByDescending(keySelector) : query.OrderBy(keySelector);

            // Получаем общее количество записей
            var totalCount = await query.CountAsync();

            var startItem = (request.PageNumber - 1) * request.PageSize;
            var numItems = request.PageSize;

            var items = await query
                .Skip(startItem)
                .Take(numItems)
                .Select(x => new HistoryDto(
                    x.Id,
                    x.Text,
                    x.Date,
                    x.User.FullName,
                    x.EventType.Name))
                .ToListAsync();

            return new HistoryListResponseDto(items, totalCount, request.PageNumber, request.PageSize);
        }
    }
}
