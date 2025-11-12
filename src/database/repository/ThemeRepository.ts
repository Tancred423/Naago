import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { themes } from "../schema/themes.ts";

export class ThemeRepository {
  static async get(characterId: number): Promise<string> {
    const result = await database
      .select({ theme: themes.theme })
      .from(themes)
      .where(eq(themes.characterId, characterId))
      .limit(1);

    return result[0]?.theme ?? "dark";
  }

  static async set(
    userId: string,
    characterId: number,
    theme: string,
  ): Promise<void> {
    await database
      .insert(themes)
      .values({ userId, characterId, theme })
      .onDuplicateKeyUpdate({ set: { characterId, theme } });
  }

  static async delete(userId: string): Promise<void> {
    await database
      .delete(themes)
      .where(eq(themes.userId, userId));
  }
}
