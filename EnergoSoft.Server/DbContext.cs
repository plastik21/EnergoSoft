namespace EnergoSoft.Server
{
    using Microsoft.EntityFrameworkCore;
    using Microsoft.EntityFrameworkCore.Diagnostics;

    public class EnergoSoftDbContext : DbContext
    {
        // Пользователи
        public DbSet<User> Users { get; set; }
        // Типы событий
        public DbSet<EventType> EventTypes { get; set; }
        // История
        public DbSet<History> Histories { get; set; }

        public EnergoSoftDbContext(DbContextOptions<EnergoSoftDbContext> options)
                : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(wcb => wcb.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var (eventTypes, users, histories) = GenerateRandomData();

            // Типы событий
            modelBuilder.Entity<EventType>(entity =>
            {
                // Столбец Id без автоинкремента
                entity.Property(e => e.Id).ValueGeneratedNever();
                entity.HasData(eventTypes);
            });

            // Пользователи
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasData(users);
            });

            // История
            modelBuilder.Entity<History>(entity =>
            {
                entity.HasOne(h => h.User).WithMany(u => u.Histories).HasForeignKey(h => h.UserId);
                entity.HasOne(h => h.EventType).WithMany().HasForeignKey(h => h.EventTypeId);
                entity.HasData(histories);
            });
        }

        private static (EventType[] eventTypes, User[] users, List<History> histories) GenerateData()
        {
            // Генерация типов событий
            var eventTypes = new[]
            {
                new EventType { Id = EventTypeId.Edit, Name = "Редактирование записи" },
                new EventType { Id = EventTypeId.Add, Name = "Добавление записи" },
                new EventType { Id = EventTypeId.Delete, Name = "Удаление записи" }
            };

            // Генерация пользователей
            var users = new[]
            {
                new User { Id = Guid.Parse("c43f637c-17ea-46ef-a6d1-282cb9235f7f"), FullName = "Иванов Иван Иванович" },
                new User { Id = Guid.Parse("6b4e448e-80ac-4f46-9e1b-1aa689132a07"), FullName = "Петров Пётр Петрович" },
                new User { Id = Guid.Parse("3bcd31b0-890e-4733-8f31-0231e9505ce2"), FullName = "Сидоров Сидр Сидорович" }
            };

            // Генерация 1000 записей истории                        
            var userIds = users.Select(x => x.Id).ToArray();
            var eventIds = eventTypes.Select(x => x.Id).ToArray();
            var histories = new List<History>();
            var baseDate = new DateTime(2026, 2, 13, 0, 0, 0, DateTimeKind.Utc);

            for (var i = 1; i <= 1000; i++)
            {
                var eventType = eventTypes[i % eventTypes.Length];

                histories.Add(new History
                {
                    Id = i,
                    Text = eventType.Name,
                    Date = baseDate.AddHours(i),
                    UserId = userIds[i % userIds.Length],
                    EventTypeId = eventType.Id
                });
            }

            return (eventTypes, users, histories);
        }

        private static (EventType[] eventTypes, User[] users, List<History> histories) GenerateRandomData()
        {
            // Генерация типов событий
            var eventTypes = new[]
            {
                new EventType { Id = EventTypeId.Edit, Name = "Редактирование записи" },
                new EventType { Id = EventTypeId.Add, Name = "Добавление записи" },
                new EventType { Id = EventTypeId.Delete, Name = "Удаление записи" }
            };

            // Генерация пользователей
            var users = new[]
            {
                new User { Id = Guid.Parse("c43f637c-17ea-46ef-a6d1-282cb9235f7f"), FullName = "Иванов Иван Иванович" },
                new User { Id = Guid.Parse("6b4e448e-80ac-4f46-9e1b-1aa689132a07"), FullName = "Петров Пётр Петрович" },
                new User { Id = Guid.Parse("3bcd31b0-890e-4733-8f31-0231e9505ce2"), FullName = "Сидоров Сидр Сидорович" }
            };

            // Генерация 1000 записей истории                        
            var userIds = users.Select(x => x.Id).ToArray();
            var eventIds = eventTypes.Select(x => x.Id).ToArray();
            var histories = new List<History>();
            var baseDate = new DateTime(2026, 2, 13, 0, 0, 0, DateTimeKind.Utc);
            var random = new Random();

            for (var i = 0; i < 1000; i++)
            {
                histories.Add(new History
                {
                    Id = i + 1,
                    Text = $"Текст {i % 100}",
                    Date = baseDate.AddHours(random.Next(24 * 30 * 3)),
                    UserId = userIds[random.Next(userIds.Length)],
                    EventTypeId = eventIds[random.Next(eventIds.Length)]
                });
            }

            return (eventTypes, users, histories);
        }
    }
}
