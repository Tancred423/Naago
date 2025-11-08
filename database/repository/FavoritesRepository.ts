import { and, eq } from "drizzle-orm";
import { database } from "../../database/connection.ts";
import { type Favorite, favorites } from "../schema/favorites.ts";
import { AlreadyInDatabaseError } from "../error/AlreadyInDatabaseError.ts";
import { MaximumAmountReachedError } from "../error/MaximumAmountReachedError.ts";
import { NotInDatabaseError } from "../error/NotInDatabaseError.ts";

export class FavoritesRepository {
  static async get(
    userId: string,
  ): Promise<Favorite[]> {
    return await database
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
  }

  static async add(
    userId: string,
    characterId: number,
    characterName: string,
    server: string,
  ): Promise<void> {
    const userFavorites = await this.get(userId);

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

    await database.insert(favorites).values({
      userId,
      characterId,
      characterName,
      server,
    });
  }

  static async delete(
    userId: string,
    characterId: number,
  ): Promise<void> {
    const userFavorites = await this.get(userId);

    if (
      !userFavorites?.find((userFavorite) =>
        userFavorite.characterId === characterId
      )
    ) {
      throw new NotInDatabaseError("This character is not a favorite.");
    }

    await database
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.characterId, characterId),
        ),
      );
  }

  static async deleteAll(userId: string): Promise<void> {
    await database
      .delete(favorites)
      .where(eq(favorites.userId, userId));
  }
}
