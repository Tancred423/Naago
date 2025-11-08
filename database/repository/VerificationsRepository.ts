import { and, eq } from "drizzle-orm";
import { type Verification, verifications } from "../schema/verifications.ts";
import { database } from "../connection.ts";

export class VerificationsRepository {
  static async find(
    userId: string,
  ): Promise<Verification | null> {
    const result = await database
      .select()
      .from(verifications)
      .where(eq(verifications.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  static async setVerificationCode(
    userId: string,
    characterId: number,
    verificationCode: string,
  ): Promise<void> {
    await database
      .insert(verifications)
      .values({ userId, characterId, verificationCode, isVerified: false })
      .onDuplicateKeyUpdate({ set: { verificationCode } });
  }

  static async setIsVerifiedTrue(
    userId: string,
    characterId: number,
  ): Promise<void> {
    await database
      .update(verifications)
      .set({ characterId, isVerified: true })
      .where(eq(verifications.userId, userId));
  }

  static async delete(userId: string, characterId: number): Promise<void> {
    await database
      .delete(verifications)
      .where(and(
        eq(verifications.userId, userId),
        eq(verifications.characterId, characterId),
      ));
  }

  // static async getCharacter(
  //   userId: string,
  // ): Promise<{ id: number; name: string; server: any } | undefined> {
  //   const verification = await database
  //     .select({ characterId: verifications.characterId })
  //     .from(verifications)
  //     .where(eq(verifications.userId, userId))
  //     .limit(1);

  //   if (!verification[0]) return undefined;

  //   const characterId = verification[0].characterId;

  //   const charData = await database
  //     .select({ jsonString: characterData.jsonString })
  //     .from(characterData)
  //     .where(eq(characterData.characterId, characterId))
  //     .limit(1);

  //   const parsedCharacterData = charData[0]
  //     ? JSON.parse(charData[0].jsonString!)
  //     : undefined;

  //   return {
  //     id: parseInt(characterId),
  //     name: parsedCharacterData?.name,
  //     server: parsedCharacterData?.server,
  //   };
  // }
}
