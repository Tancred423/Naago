import { and, eq } from "drizzle-orm";
import { db } from "../../db/connection.ts";
import { type Favorite, favorites } from "../schema/favorites.ts";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { MaximumAmountReachedError } from "../error/MaximumAmountReachedError.ts";
import { NotInDatabaseError } from "../error/NotInDatabaseError.ts";

export class FavoritesRepository {
  static async getFavorites(
    userId: string,
  ): Promise<Favorite[]> {
    const result = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));

    return result;
  }

  static async addFavorite(
    userId: string,
    characterId: number,
    characterName: string,
    server: string,
  ): Promise<void> {
    const userFavorites = await this.getFavorites(userId);

    if (userFavorites && userFavorites.length >= 25) {
      throw new MaximumAmountReachedError(
        "This user already has 25 favorites.",
      );
    }

    if (
      userFavorites?.find((userFavorite) =>
        userFavorite.characterId === characterId
      )
    ) {
      throw new AlreadyInDatabaseError("The character is already a favorite.");
    }

    await db.insert(favorites).values({
      userId,
      characterId,
      characterName,
      server,
    });
  }

  static async removeFavorite(
    userId: string,
    characterId: number,
  ): Promise<void> {
    const userFavorites = await this.getFavorites(userId);

    if (
      !userFavorites?.find((userFavorite) =>
        userFavorite.characterId === characterId
      )
    ) {
      throw new NotInDatabaseError("This character is not a favorite.");
    }

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.characterId, characterId),
        ),
      );
  }
}
