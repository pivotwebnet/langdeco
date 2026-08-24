using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        db.Categories.AddRange(
            // Piezas mayores
            new Category { Id = "mesas-comedor", Name = "Mesas comedor", Group = CategoryGroup.Mayor },
            new Category { Id = "mesas-de-luz", Name = "Mesas de luz", Group = CategoryGroup.Mayor },
            new Category { Id = "mesas-ratonas", Name = "Mesas ratonas", Group = CategoryGroup.Mayor },
            new Category { Id = "recibidores-mesas-arrime", Name = "Recibidores / mesas de arrime", Group = CategoryGroup.Mayor },
            new Category { Id = "racks-tv", Name = "Racks TV", Group = CategoryGroup.Mayor },
            new Category { Id = "escritorios", Name = "Escritorios", Group = CategoryGroup.Mayor },
            new Category { Id = "percheros-repisas", Name = "Percheros / repisas", Group = CategoryGroup.Mayor },
            new Category { Id = "bancos", Name = "Bancos", Group = CategoryGroup.Mayor },

            // Pequeños tesoros
            new Category { Id = "canastos-cestos", Name = "Canastos / cestos", Group = CategoryGroup.Tesoro },
            new Category { Id = "almohadones-y-mantas", Name = "Almohadones y mantas", Group = CategoryGroup.Tesoro },
            new Category { Id = "fanales-y-candelabros", Name = "Fanales y candelabros", Group = CategoryGroup.Tesoro },
            new Category { Id = "aromas-y-velas", Name = "Aromas y velas", Group = CategoryGroup.Tesoro },
            new Category { Id = "floreros-jarrones", Name = "Floreros / jarrones", Group = CategoryGroup.Tesoro },
            new Category { Id = "bandejas", Name = "Bandejas", Group = CategoryGroup.Tesoro },
            new Category { Id = "espejos", Name = "Espejos", Group = CategoryGroup.Tesoro },
            new Category { Id = "relojes", Name = "Relojes", Group = CategoryGroup.Tesoro },
            new Category { Id = "manteles", Name = "Manteles", Group = CategoryGroup.Tesoro },
            new Category { Id = "caminos-de-mesa", Name = "Caminos de mesa", Group = CategoryGroup.Tesoro },
            new Category { Id = "platos-de-sitio", Name = "Platos de sitio", Group = CategoryGroup.Tesoro },
            new Category { Id = "plantas-artificiales", Name = "Plantas artificiales", Group = CategoryGroup.Tesoro },
            new Category { Id = "cuadros", Name = "Cuadros", Group = CategoryGroup.Tesoro },
            new Category { Id = "adornos-y-accesorios", Name = "Adornos y accesorios", Group = CategoryGroup.Tesoro },
            new Category { Id = "gift-card", Name = "Gift card", Group = CategoryGroup.Tesoro }
        );

        await db.SaveChangesAsync();
    }
}
