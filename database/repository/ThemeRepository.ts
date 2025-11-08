import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { themes } from "../schema/themes.ts";

export class ThemeRepository {
  static async get(userId: string): Promise<string> {
    const result = await database
      .select({ theme: themes.theme })
      .from(themes)
      .where(eq(themes.userId, userId))
      .limit(1);

    return result[0]?.theme ?? "dark";
  }

  static async set(userId: string, theme: string): Promise<void> {
    await database
      .insert(themes)
      .values({ userId, theme })
      .onDuplicateKeyUpdate({ set: { theme } });
  }

  static async delete(userId: string): Promise<void> {
    await database
      .delete(themes)
      .where(eq(themes.userId, userId));
  }
}
