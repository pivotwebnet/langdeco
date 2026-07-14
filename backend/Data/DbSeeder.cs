using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Categories.AnyAsync()) return;

        var mayor = new Category { Id = "mayor", Name = "Piezas Mayores", Active = true };
        var tesoro = new Category { Id = "tesoro", Name = "Pequeños Tesoros", Active = true };
        db.Categories.AddRange(mayor, tesoro);

        db.Products.AddRange(
            Product("pm-sofa-liviano", "Sofá Liviano", mayor.Id, "Sofá · 3 plazas", "Lino crudo · roble", "Atelier Mestre · Galicia", 4890000, "4/5",
                images: new[] {
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=85",
                    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=85",
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "220 × 90 × 80 cm"), ("Plazas", "3"), ("Tapizado", "Lino crudo natural"),
                    ("Estructura", "Roble macizo"), ("Relleno", "Fibra HD + plumón"), ("Entrega", "8 – 10 semanas"),
                }),
            Product("pm-mesa-comedor", "Mesa Comedor Roble", mayor.Id, "Comedor", "Roble macizo curado", "Taller Olabarria · Navarra", 3480000, "4/5",
                images: new[] {
                    "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=500&q=85",
                    "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=500&q=85",
                    "https://images.unsplash.com/photo-1565791380713-1756b9a05343?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "220 × 100 × 76 cm"), ("Material", "Roble macizo curado 3 años"), ("Acabado", "Aceite natural de tung"),
                    ("Peso", "68 kg"), ("Comensales", "8 – 10 personas"), ("Entrega", "6 – 8 semanas"),
                }),
            Product("pm-cabecero-tela", "Cabecero Tela", mayor.Id, "Dormitorio", "Lino · pino macizo", "Studio Möller · Copenhague", 2190000, "4/5",
                images: new[] {
                    "https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=500&q=85",
                    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=85",
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=85",
                },
                specs: new[] {
                    ("Medidas", "180 × 120 cm (para cama 160)"), ("Tapizado", "Lino belga 100%"), ("Estructura", "Pino macizo"),
                    ("Grosor acolchado", "8 cm"), ("Disponible en", "135, 150, 160, 180 cm"), ("Entrega", "4 – 6 semanas"),
                }),
            Product("pm-biblioteca", "Biblioteca Mármol", mayor.Id, "Biblioteca", "Mármol · roble", "Atelier Bonet · Barcelona", 5280000, "4/5",
                images: new[] {
                    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=85",
                    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&q=85",
                    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "180 × 35 × 220 cm"), ("Estantes", "4 ajustables + base"), ("Material estantes", "Mármol Carrara"),
                    ("Estructura", "Roble macizo"), ("Peso", "95 kg"), ("Entrega", "10 – 12 semanas"),
                }),
            Product("pm-sillon-velvet", "Sillón Velvet", mayor.Id, "Butaca", "Terciopelo · haya", "Cooperativa Karaca · Turquía", 2890000, "4/5",
                images: new[] {
                    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=500&q=85",
                    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=85",
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "82 × 88 × 90 cm"), ("Tapizado", "Terciopelo 100% algodón"), ("Estructura", "Haya maciza"),
                    ("Relleno asiento", "Espuma HR + plumón"), ("Peso", "24 kg"), ("Entrega", "6 – 8 semanas"),
                }),
            Product("pm-comoda", "Cómoda Travertino", mayor.Id, "Almacenaje", "Madera · piedra", "Studio Möller · Copenhague", 3150000, "4/5",
                images: new[] {
                    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500&q=85",
                    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&q=85",
                    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "140 × 45 × 85 cm"), ("Cajones", "3"), ("Sobre", "Travertino romano"),
                    ("Cuerpo", "MDF lacado mate"), ("Tiradores", "Latón envejecido"), ("Entrega", "8 – 10 semanas"),
                }),

            Product("pt-vela-cedro", "Vela Soja Cedro", tesoro.Id, null, "Cera de soja", null, 38000, null,
                images: new[] { "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=85", "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=85" },
                specs: new[] { ("Peso neto", "280 g"), ("Duración", "55 horas"), ("Aroma", "Cedro & ámbar gris"), ("Sin parafina", "Sí · 100% vegetal") }),
            Product("pt-jarron-hueso", "Jarrón Hueso", tesoro.Id, null, "Cerámica esmaltada", null, 68000, null,
                images: new[] { "https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?w=400&q=85", "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&q=85" },
                specs: new[] { ("Altura", "28 cm"), ("Diámetro boca", "8 cm"), ("Material", "Cerámica alta temperatura"), ("Hecho a mano", "Sí · único") }),
            Product("pt-cuenco-madera", "Cuenco Madera", tesoro.Id, null, "Olivo torneado", null, 54000, null,
                images: new[] { "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=85", "https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?w=400&q=85" },
                specs: new[] { ("Diámetro", "22 cm"), ("Altura", "7 cm"), ("Material", "Madera de olivo"), ("Acabado", "Aceite de oliva") }),
            Product("pt-servilletas", "Servilletas Lino", tesoro.Id, null, "Lino · set 4", null, 42000, null,
                images: new[] { "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&q=85", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=85" },
                specs: new[] { ("Dimensiones", "45 × 45 cm"), ("Material", "Lino lavado 100%"), ("Unidades", "4 servilletas"), ("Cuidado", "Lavado a 40°") }),
            Product("pt-bandeja-laton", "Bandeja Latón", tesoro.Id, null, "Latón pulido", null, 89000, null,
                images: new[] { "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&q=85", "https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?w=400&q=85" },
                specs: new[] { ("Dimensiones", "38 × 28 × 3 cm"), ("Material", "Latón macizo"), ("Acabado", "Pulido a mano"), ("Patina", "Natural con el uso") }),
            Product("pt-marco-laton", "Marco Latón", tesoro.Id, null, "Latón · A5", null, 52000, null,
                images: new[] { "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&q=85", "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=400&q=85" },
                specs: new[] { ("Formato", "A5 · 15 × 21 cm"), ("Material", "Latón 2 mm"), ("Apertura", "Posterior con traba"), ("Disponible en", "A6, A5, A4") }),
            Product("pt-plato-deco", "Plato Decorativo", tesoro.Id, null, "Cerámica pintada", null, 78000, null,
                images: new[] { "https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=400&q=85", "https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?w=400&q=85" },
                specs: new[] { ("Diámetro", "32 cm"), ("Material", "Cerámica pintada a mano"), ("Motivo", "Botánico abstracto"), ("Uso", "Decorativo · no alimentario") }),
            Product("pt-portavelas", "Portavelas", tesoro.Id, null, "Cerámica cruda", null, 36000, null,
                images: new[] { "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=85", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=85" },
                specs: new[] { ("Altura", "12 cm"), ("Diámetro", "8 cm"), ("Vela compatible", "Ø 3,5 – 4 cm"), ("Acabado", "Terracota cruda") }),
            Product("pt-libro-color", "Libro · El color", tesoro.Id, null, "Tapa dura", null, 48000, null,
                images: new[] { "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=85", "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&q=85" },
                specs: new[] { ("Formato", "24 × 30 cm"), ("Páginas", "320"), ("Idioma", "Español / Inglés"), ("Editorial", "Taschen · 2023") }),
            Product("pt-incienso", "Incienso Cipres", tesoro.Id, null, "Madera prensada", null, 22000, null,
                images: new[] { "https://images.unsplash.com/photo-1588087879557-3f95f08be4b6?w=400&q=85", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=85" },
                specs: new[] { ("Varillas", "20 unidades"), ("Duración c/u", "40 minutos"), ("Aroma", "Ciprés & madera de cedro"), ("Soporte", "Incluido") }),
            Product("pt-tarro-vidrio", "Tarro Vidrio", tesoro.Id, null, "Vidrio soplado", null, 64000, null,
                images: new[] { "https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=400&q=85", "https://images.unsplash.com/photo-1578500351865-d6c3706f46bc?w=400&q=85" },
                specs: new[] { ("Capacidad", "500 ml"), ("Altura", "20 cm"), ("Material", "Vidrio soplado artesanal"), ("Cierre", "Tapa corcho natural") }),
            Product("pt-pano-cocina", "Paños Cocina", tesoro.Id, null, "Algodón · set 3", null, 28000, null,
                images: new[] { "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=85", "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&q=85" },
                specs: new[] { ("Dimensiones", "50 × 70 cm"), ("Material", "Algodón jacquard"), ("Unidades", "3 paños"), ("Cuidado", "Lavado a 60°") }),

            // Selección de Carmen (destacados)
            Product("butaca-laurel", "Butaca Laurel", mayor.Id, null, "Roble · lino crudo", "Taller Olabarria · Navarra", 2480000, "3/4.2",
                images: new[] {
                    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=85",
                    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "74 × 80 × 88 cm"), ("Tapizado", "Lino crudo natural"), ("Estructura", "Roble macizo"), ("Entrega", "6 – 8 semanas"),
                },
                featured: true,
                note: "La traje de un taller en Pamplona. La estructura es de roble macizo curado al aire. Para un rincón de lectura — no para mirarse."),
            Product("mesa-arenisca", "Mesa Arenisca", mayor.Id, null, "Piedra · acero", "Studio Möller · Copenhague", 3150000, "3/4.2",
                images: new[] {
                    "https://images.unsplash.com/photo-1565791380713-1756b9a05343?w=600&q=85",
                    "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "Ø 60 × A 45 cm"), ("Sobre", "Arenisca de Gotland"), ("Base", "Acero negro mate"), ("Entrega", "8 – 10 semanas"),
                },
                featured: true,
                note: "Una sola pieza de arenisca de Gotland. Cada veta es distinta — la mía tiene un mapa imposible."),
            Product("lampara-pergamino", "Lámpara Pergamino", mayor.Id, null, "Latón · pergamino", "Atelier Bonet · Barcelona", 690000, "3/4.2",
                images: new[] {
                    "https://images.unsplash.com/photo-1513506003901-1e6a35f3a9d3?w=600&q=85",
                    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=85",
                },
                specs: new[] {
                    ("Altura", "42 cm (pantalla 28 cm)"), ("Pantalla", "Pergamino natural"), ("Pie", "Latón bruñido"), ("Bombilla", "E27 · máx. 40W"),
                },
                featured: true,
                note: "Luz cálida, casi de vela. Se enciende con un cordón de seda."),
            Product("alfombra-anatolia", "Alfombra Anatolia", mayor.Id, null, "Lana virgen anudada", "Cooperativa Karaca · Turquía", 1890000, "3/4.2",
                images: new[] {
                    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=85",
                    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&q=85",
                },
                specs: new[] {
                    ("Dimensiones", "200 × 300 cm"), ("Material", "Lana virgen anudada"), ("Densidad", "120 nudos/dm²"), ("Tejido", "A mano · 8 meses"),
                },
                featured: true,
                note: "Tejida a mano por mujeres en un pueblo del Egeo. Tarda ocho meses en hacerse.")
        );

        await db.SaveChangesAsync();

        // Stock inicial de muestra: piezas mayores con poco stock (fabricación a pedido), tesoros con stock normal.
        foreach (var p in db.Products.Local)
        {
            p.Stock = p.CategoryId == "mayor" ? 2 : 15;
        }
        await db.SaveChangesAsync();
    }

    private static Product Product(
        string id, string name, string categoryId, string? tag, string material, string? origin,
        decimal price, string? aspect, string[] images, (string Label, string Value)[] specs,
        bool featured = false, string? note = null)
    {
        var product = new Product
        {
            Id = id,
            Name = name,
            CategoryId = categoryId,
            Tag = tag,
            Material = material,
            Origin = origin,
            Price = price,
            Aspect = aspect,
            Active = true,
            Featured = featured,
            Note = note,
        };

        for (int i = 0; i < images.Length; i++)
            product.Images.Add(new ProductImage { Url = images[i], Order = i });

        for (int i = 0; i < specs.Length; i++)
            product.Specs.Add(new ProductSpec { Label = specs[i].Label, Value = specs[i].Value, Order = i });

        return product;
    }
}
