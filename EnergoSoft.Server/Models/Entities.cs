namespace EnergoSoft.Server
{
    public enum EventTypeId
    {
        Edit = 1,
        Add = 2,
        Delete = 3
    }

    /// <summary>
    /// Тип события
    /// </summary>
    public class EventType
    {
        /// <summary>
        /// Идентификатор без автоинкремента
        /// </summary>
        public required EventTypeId Id { get; set; }

        /// <summary>
        /// Наименование
        /// </summary>
        public required string Name { get; set; }
    }

    /// <summary>
    /// Данные пользователя
    /// </summary>
    public class User
    {
        /// <summary>
        /// Идентификатор 
        /// </summary>
        public required Guid Id { get; set; }

        /// <summary>
        /// ФИО
        /// </summary>
        public required string FullName { get; set; }

        /// <summary>
        /// Записи в таблице истории
        /// </summary>
        public ICollection<History> Histories { get; set; } = [];
    }

    /// <summary>
    /// Запись в таблице истории
    /// </summary>
    public class History
    {
        /// <summary>
        /// Идентификатор с автоинкрементом
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Текст
        /// </summary>
        public string? Text { get; set; }

        /// <summary>
        /// Пользователь
        /// </summary>
        public required Guid UserId { get; set; }
        public User User { get; set; } = null!;

        /// <summary>
        /// Дата и время
        /// </summary>
        public required DateTime Date { get; set; }

        /// <summary>
        /// Тип события
        /// </summary>
        public required EventTypeId EventTypeId { get; set; }
        public EventType EventType { get; set; } = null!;
    }
}
