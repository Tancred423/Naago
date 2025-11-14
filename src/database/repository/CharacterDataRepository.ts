import { database } from "../connection.ts";
import { CharacterData, characterData } from "../schema/character-data.ts";
import { eq } from "drizzle-orm";
import moment from "moment";
import { Character } from "../../naagostone/type/CharacterTypes.ts";
import * as log from "@std/log";

export class CharacterDataRepository {
  public static async find(
    characterId: number,
  ): Promise<CharacterData | null> {
    const result = await database
      .select()
      .from(characterData)
      .where(eq(characterData.characterId, characterId))
      .limit(1);

    return result[0] ?? null;
  }

  public static async set(character: Character): Promise<void> {
    const now = Date.now();
    const nowSQL = moment(now).tz("UTC").toDate();
    log.info("latestupdate in repo", nowSQL, moment().unix());
    await database
      .insert(characterData)
      .values({
        characterId: character.id,
        latestUpdate: nowSQL,
        jsonString: JSON.stringify(character),
      })
      .onDuplicateKeyUpdate({
        set: {
          latestUpdate: nowSQL,
          jsonString: JSON.stringify(character),
        },
      });
  }

  public static async delete(characterId: number): Promise<void> {
    await database
      .delete(characterData)
      .where(eq(characterData.characterId, characterId));
  }
}
