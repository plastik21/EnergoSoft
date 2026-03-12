namespace EnergoSoft.Server.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using System.Linq.Expressions;

    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private const int DefaultPageSize = 10;

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
                { "id", x => x.Id },
                { "text", x => x.Text ?? string.Empty },
                { "userFullName", x => x.User.FullName },
                { "date", x => x.Date },
                { "eventTypeName", x => x.EventType.Name }
            };

            var sortBy = !string.IsNullOrWhiteSpace(request.SortBy) ? request.SortBy : "id";

            if (!sortColumns.TryGetValue(sortBy, out var keySelector))
            {
                keySelector = sortColumns["id"];
            }

            // Добавляем сортировку к запросу
            query = request.IsDescending ? query.OrderByDescending(keySelector) : query.OrderBy(keySelector);

            // Получаем параметры пагинации
            var totalCount = await query.CountAsync();
            var pageNumber = Math.Max(request.PageNumber, 0);
            var pageSize = request.PageSize > 0 ? request.PageSize : DefaultPageSize;
            var startItem = pageNumber * pageSize;

            // Выполняем запрос
            var items = await query
                .Skip(startItem)
                .Take(pageSize)
                .Select(x => new HistoryDto(
                    x.Id,
                    x.Text,
                    x.Date,
                    x.User.FullName,
                    x.EventType.Name))
                .ToListAsync();

            return new HistoryListResponseDto(items, totalCount, pageNumber, pageSize);
        }

        [HttpGet("list2")]
        public async Task<HistoryListResponseDto2> List2([FromQuery] HistoryListRequestDto request)
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
                { "id", x => x.Id },
                { "text", x => x.Text ?? string.Empty },
                { "userFullName", x => x.User.FullName },
                { "date", x => x.Date },
                { "eventTypeName", x => x.EventType.Name }
            };

            var sortBy = !string.IsNullOrWhiteSpace(request.SortBy) ? request.SortBy : "id";

            if (!sortColumns.TryGetValue(sortBy, out var keySelector))
            {
                keySelector = sortColumns["id"];
            }

            // Добавляем сортировку к запросу
            query = request.IsDescending ? query.OrderByDescending(keySelector) : query.OrderBy(keySelector);

            var query2 = query.GroupBy(x => x.UserId)
                .Select(x => new
                {
                    UserId = x.Key,
                    Items = x.Select(y => new HistoryDto
                    (
                        y.Id,
                        y.Text,
                        y.Date,
                        y.User.FullName,
                        y.EventType.Name
                    ))
                });

            // Получаем параметры пагинации
            var totalCount = await query2.CountAsync();
            var pageNumber = Math.Max(request.PageNumber, 0);
            var pageSize = request.PageSize > 0 ? request.PageSize : DefaultPageSize;
            var startItem = pageNumber * pageSize;

            // Выполняем запрос
            var result = await query2
                .Skip(startItem)
                .Take(pageSize)
                .ToListAsync();

            var items = result.Select(x => x.Items.ToArray()).ToList();

            return new HistoryListResponseDto2(items, totalCount, pageNumber, pageSize);
        }
    }
}
