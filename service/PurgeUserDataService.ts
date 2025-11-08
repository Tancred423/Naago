import { CharacterDataRepository } from "../database/repository/CharacterDataRepository.ts";
import { FavoritesRepository } from "../database/repository/FavoritesRepository.ts";
import { ProfilePagesRepository } from "../database/repository/ProfilePagesRepository.ts";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";

export class PurgeUserDataService {
  static async purgeUser(userId: string, characterId: number): Promise<void> {
    await Promise.all([
      FavoritesRepository.deleteAll(userId),
      ProfilePagesRepository.delete(userId),
      ThemeRepository.delete(userId),
      CharacterDataRepository.delete(characterId),
      VerificationsRepository.delete(userId, characterId),
    ]);
  }
}
