namespace EnergoSoft.Server.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Query;
    using System.Linq.Expressions;

    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private const int DefaultPageSize = 10;

        private readonly EnergoSoftDbContext _context;

        private static readonly Dictionary<string, Expression<Func<History, object>>> columnsMap = new()
        {
            { "id", x => x.Id },
            { "text", x => x.Text ?? string.Empty },
            { "userFullName", x => x.User.FullName },
            { "date", x => x.Date },
            { "eventTypeName", x => x.EventType.Name }
        };

        public HistoryController(EnergoSoftDbContext context)
        {
            _context = context;
        }

        [HttpGet("list")]
        public async Task<HistoryListResponseDto> List([FromQuery] HistoryListRequestDto request)
        {
            // Поле группировки
            var groupBy = !string.IsNullOrWhiteSpace(request.GroupBy) ? request.GroupBy : "userFullName";

            if (!columnsMap.TryGetValue(groupBy, out var groupKeySelector))
            {
                groupKeySelector = columnsMap["userFullName"];
            }

            // Поле сортировки
            var sortBy = !string.IsNullOrWhiteSpace(request.SortBy) ? request.SortBy : "id";

            if (!columnsMap.TryGetValue(sortBy, out var sortKeySelector))
            {
                sortKeySelector = columnsMap["id"];
            }

            // Параметры пагинации
            var pageNumber = Math.Max(request.PageNumber, 0);
            var pageSize = request.PageSize > 0 ? request.PageSize : DefaultPageSize;

            // Базовый запрос
            var query = _context.Histories
                .Include(x => x.User)
                .Include(x => x.EventType)
                .AsQueryable();

            // Применяем фильтры
            query = ApplyFilters(query, request);

            // Получаем группы
            var groupKeysQuery = query
                .GroupBy(groupKeySelector)
                .Select(x => x.Key);

            // Всего групп
            var totalCount = await groupKeysQuery.CountAsync();

            if (sortBy == groupBy)
            {
                // Направление сортировки из запроса
                groupKeysQuery =
                    request.IsDescending ?
                    groupKeysQuery.OrderByDescending(x => x) :
                    groupKeysQuery.OrderBy(x => x);
            }
            else
            {
                // Направление сортировки по-умолчанию
                groupKeysQuery = groupKeysQuery.OrderBy(x => x);
            }

            // Применяем пагинацию к группам
            groupKeysQuery = groupKeysQuery
                .Skip(pageNumber * pageSize)
                .Take(pageSize);

            // Фильтрация по группам (x => groupKeysQuery.Contains(groupKeySelector(x)))
            query = query.Where(BuildContainsPredicate(groupKeySelector, groupKeysQuery));

            // Добавляем сортировку
            query = request.IsDescending ? query.OrderByDescending(sortKeySelector) : query.OrderBy(sortKeySelector);

            // Выполняем запрос
            var data = await query.ToListAsync();

            var sortKeyExpr = sortKeySelector.Compile();
            var groupKeyExpr = groupKeySelector.Compile();

            // Финальные данные
            var items = data
                .GroupBy(groupKeyExpr)
                .Select(x => new HistoryGroupedItem
                (
                    GroupName: GetGroupName(x.Key),
                    Children: (request.IsDescending ? x.OrderByDescending(sortKeyExpr) : x.OrderBy(sortKeyExpr))
                        .Select(y => new HistoryDto
                        (
                            y.Id,
                            y.Text,
                            y.Date,
                            y.User.FullName,
                            y.EventType.Name
                        ))
                        .ToArray()
                ))
                .ToArray();

            return new HistoryListResponseDto(items, totalCount, pageNumber, pageSize);
        }

        private static IQueryable<History> ApplyFilters(IQueryable<History> query, HistoryListRequestDto request)
        {
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

            // Фильтр по дате
            if (request.DateFrom.HasValue)
            {
                query = query.Where(x => x.Date >= request.DateFrom.Value);
            }

            // Фильтр по дате
            if (request.DateTo.HasValue)
            {
                var dateTo = request.DateTo.Value.AddDays(1);

                query = query.Where(x => x.Date < dateTo);
            }

            // Фильтр по EventTypeName
            if (!string.IsNullOrWhiteSpace(request.EventTypeName))
            {
                query = query.Where(x => EF.Functions.ILike(x.EventType.Name ?? string.Empty, $"%{request.EventTypeName}%"));
            }

            return query;
        }

        private static Expression<Func<History, bool>> BuildContainsPredicate<TKey>(
            Expression<Func<History, TKey>> selector,
            IQueryable<TKey> values)
        {
            var method = typeof(Queryable)
                .GetMethods()
                .First(m => m.Name == "Contains" && m.GetParameters().Length == 2)
                .MakeGenericMethod(typeof(TKey));

            // Создаем новый параметр для итогового выражения
            var parameter = Expression.Parameter(typeof(History), "x");

            // Заменяем старый параметр из selector-а на новый
            var newSelector = ReplacingExpressionVisitor.Replace(
                selector.Parameters[0],
                parameter,
                selector.Body);

            // values.Contains(x.Property)
            var body = Expression.Call(null, method, values.Expression, newSelector);

            return Expression.Lambda<Func<History, bool>>(body, parameter);
        }

        private static string GetGroupName(object key)
        {
            if (key is DateTime date)
            {
                return date.ToLocalTime().ToString();
            }

            return key?.ToString() ?? "Безымянная группа";
        }
    }
}
