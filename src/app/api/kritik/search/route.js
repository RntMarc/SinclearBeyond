import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

// Diverse mock data to cover multiple platforms when the external API doesn't have them
const fallbackGames = [
  {
    externalId: "m1",
    title: "The Legend of Zelda: Breath of the Wild",
    description: "Action-adventure game",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    releaseDate: "2017-03-03",
    type: "game",
  },
  {
    externalId: "m2",
    title: "Super Mario Odyssey",
    description: "Platform game",
    image:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=2071&auto=format&fit=crop",
    releaseDate: "2017-10-27",
    type: "game",
  },
  {
    externalId: "m3",
    title: "God of War Ragnarök",
    description: "Action-adventure game",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    releaseDate: "2022-11-09",
    type: "game",
  },
  {
    externalId: "m4",
    title: "Elden Ring",
    description: "Action RPG",
    image:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=2071&auto=format&fit=crop",
    releaseDate: "2022-02-25",
    type: "game",
  },
  {
    externalId: "m5",
    title: "Halo Infinite",
    description: "First-person shooter",
    image:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop",
    releaseDate: "2021-12-08",
    type: "game",
  },
  {
    externalId: "m6",
    title: "Animal Crossing: New Horizons",
    description: "Social simulation game",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    releaseDate: "2020-03-20",
    type: "game",
  },
  {
    externalId: "m7",
    title: "Final Fantasy VII Rebirth",
    description: "Action RPG",
    image:
      "https://images.unsplash.com/photo-1614027126211-175f50ba1ec9?q=80&w=2070&auto=format&fit=crop",
    releaseDate: "2024-02-29",
    type: "game",
  },
  {
    externalId: "m8",
    title: "Spider-Man 2",
    description: "Action-adventure game",
    image:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?q=80&w=2071&auto=format&fit=crop",
    releaseDate: "2023-10-20",
    type: "game",
  },
];

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    // Try to fetch from FreeToGame API (covers free PC/Browser games)
    let apiGames = [];
    try {
      const res = await fetch(`https://www.freetogame.com/api/games`, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });
      if (res.ok) {
        const allGames = await res.json();
        apiGames = allGames
          .filter((game) => game.title.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 5)
          .map((game) => ({
            externalId: `ftg-${game.id}`,
            title: game.title,
            description: game.short_description,
            image: game.thumbnail,
            releaseDate: game.release_date,
            type: "game",
          }));
      }
    } catch (apiErr) {
      console.error("[API/Kritik/Search] API Error:", apiErr);
    }

    // Mix in the diverse fallback data for missing console games
    const mixedResults = [
      ...apiGames,
      ...fallbackGames.filter((game) =>
        game.title.toLowerCase().includes(q.toLowerCase()),
      ),
    ];

    return NextResponse.json(mixedResults.slice(0, 10));
  } catch (error) {
    console.error("[API/Kritik/Search] Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
