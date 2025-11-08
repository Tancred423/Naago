import { eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { ProfilePage, profilePages } from "../schema/profile-pages.ts";

export class ProfilePagesRepository {
  static async find(
    userId: string,
  ): Promise<ProfilePage | null> {
    const result = await database
      .select()
      .from(profilePages)
      .where(eq(profilePages.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  static async set(
    userId: string,
    profilePage: string,
    subProfilePage: string | null,
  ): Promise<void> {
    await database
      .insert(profilePages)
      .values({ userId, profilePage, subProfilePage })
      .onDuplicateKeyUpdate({ set: { profilePage, subProfilePage } });
  }

  static async delete(userId: string): Promise<void> {
    await database
      .delete(profilePages)
      .where(eq(profilePages.userId, userId));
  }
}
