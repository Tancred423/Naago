import { and, eq } from "drizzle-orm";
import { database } from "../connection.ts";
import { Setup, setups } from "../schema/setups.ts";

export class SetupsRepository {
  static async getAll(type: string): Promise<Setup[]> {
    return await database
      .select()
      .from(setups)
      .where(eq(setups.type, type));
  }

  static async getChannelId(
    guildId: string,
    type: string,
  ): Promise<string | null> {
    const result = await database
      .select({ channelId: setups.channelId })
      .from(setups)
      .where(and(eq(setups.guildId, guildId), eq(setups.type, type)))
      .limit(1);

    return result[0]?.channelId ?? null;
  }

  static async setChannelId(
    guildId: string,
    type: string,
    channelId: string,
  ): Promise<void> {
    await database
      .insert(setups)
      .values({ guildId, type, channelId })
      .onDuplicateKeyUpdate({ set: { channelId } });
  }

  static async delete(
    guildId: string,
    type: string,
  ): Promise<void> {
    await database
      .delete(setups)
      .where(and(eq(setups.guildId, guildId), eq(setups.type, type)));
  }

  static async deleteAll(guildId: string): Promise<void> {
    await database
      .delete(setups)
      .where(eq(setups.guildId, guildId));
  }
}
