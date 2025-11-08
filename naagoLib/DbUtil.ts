import { and, desc, eq, gte, lte, sql as drizzleSql } from "drizzle-orm";
import moment from "moment";
import "moment-timezone";
import type {
  BaseInteraction,
  ButtonInteraction,
  CommandInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { db } from "../db/connection.ts";
import {
  type CharacterData,
  characterData,
  type Favorite,
  favorites,
  type MaintenanceData,
  maintenanceData,
  type NewFavorite,
  type NoticeData,
  noticeData,
  type ProfilePage,
  profilePages,
  type Setup,
  setups,
  socialMedias,
  type StatusData,
  statusData,
  type Theme,
  themes,
  type TopicData,
  topicData,
  type UpdateData,
  updateData,
  type Verification,
  verifications,
} from "../db/schema/index.ts";
import FfxivUtil from "./FfxivUtil.ts";
import DiscordUtil from "./DiscordUtil.ts";
import CharacterDataDto from "../dto/CharacterDataDto.ts";
import ConsoleUtil from "./ConsoleUtil.ts";

export default class DbUtil {
  ////////////////////////////////////////////
  // Verifications
  ////////////////////////////////////////////

  static async getCharacterVerification(
    userId: string,
  ): Promise<Verification | undefined> {
    try {
      const result = await db
        .select()
        .from(verifications)
        .where(eq(verifications.userId, userId))
        .limit(1);

      return result[0];
    } catch (err: any) {
      ConsoleUtil.logError(
        `Getting verification code was NOT successful. Error: ${err.message}`,
        err,
      );
      return undefined;
    }
  }

  static async setVerificationCode(
    userId: string,
    characterId: string,
    verificationCode: string,
  ): Promise<boolean> {
    try {
      const existing = await this.getCharacterVerification(userId);

      if (existing) {
        await db
          .update(verifications)
          .set({ verificationCode })
          .where(eq(verifications.userId, userId));
      } else {
        await db.insert(verifications).values({
          userId,
          characterId,
          verificationCode,
          isVerified: false,
        });
      }

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Setting verification code was NOT successful. Error: ${err.message}`,
        err,
      );
      return false;
    }
  }

  static async verifyCharacter(
    userId: string,
    characterId: string,
  ): Promise<boolean> {
    try {
      await db
        .update(verifications)
        .set({
          characterId,
          isVerified: true,
        })
        .where(eq(verifications.userId, userId));

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Verifying character was NOT successful. Error: ${err.message}`,
        err,
      );
      return false;
    }
  }

  ////////////////////////////////////////////
  // Fetch Character
  ////////////////////////////////////////////

  static async fetchCharacterCached(
    interaction: BaseInteraction,
    characterId: string,
  ): Promise<CharacterDataDto | undefined> {
    try {
      const loadingEmote = await DiscordUtil.getEmote(
        interaction.client,
        "loading",
      );

      const result = await db
        .select()
        .from(characterData)
        .where(eq(characterData.characterId, characterId))
        .limit(1);

      const characterDataRes = result[0];

      const latestUpdate = typeof characterDataRes?.latestUpdate === "object"
        ? moment(new Date(characterDataRes.latestUpdate))
        : undefined;

      const parsedCharacterData =
        typeof characterDataRes?.jsonString === "string"
          ? JSON.parse(characterDataRes.jsonString)
          : undefined;

      let characterDataDto = new CharacterDataDto(
        latestUpdate,
        parsedCharacterData,
      );

      if (characterDataDto.characterData) {
        return characterDataDto;
      }

      await interaction.editReply({
        content:
          `${loadingEmote} Updating lodestone data. This might take several seconds.`,
        components: [],
        files: [],
        embeds: [],
        attachments: [],
      });

      const character = await FfxivUtil.getCharacterById(characterId);
      if (!character) return undefined;

      const now = Date.now();
      const nowSQL = moment(now).tz("UTC").toDate();

      await db
        .insert(characterData)
        .values({
          characterId,
          latestUpdate: nowSQL,
          jsonString: JSON.stringify(character),
        })
        .onDuplicateKeyUpdate({
          set: {
            latestUpdate: nowSQL,
            jsonString: drizzleSql`VALUES(json_string)`,
          },
        });

      characterDataDto = new CharacterDataDto(moment(now), character);

      return characterDataDto;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Fetching cached character was NOT successful. Error: ${err.message}`,
        err,
      );
      return undefined;
    }
  }

  static async fetchCharacter(
    interaction: CommandInteraction | StringSelectMenuInteraction,
    characterId: number,
  ): Promise<CharacterDataDto | undefined> {
    try {
      const loadingEmote = await DiscordUtil.getEmote(
        interaction.client,
        "loading",
      );

      const result = await db
        .select()
        .from(characterData)
        .where(eq(characterData.characterId, characterId.toString()))
        .limit(1);

      const characterDataRes = result[0];

      const latestUpdate = typeof characterDataRes?.latestUpdate === "object"
        ? moment(new Date(characterDataRes.latestUpdate))
        : undefined;

      const parsedCharacterData =
        typeof characterDataRes?.jsonString === "string"
          ? JSON.parse(characterDataRes.jsonString)
          : undefined;

      let characterDataDto = new CharacterDataDto(
        latestUpdate,
        parsedCharacterData,
      );

      const updateRequired = !characterDataDto.latestUpdate ||
        characterDataDto.latestUpdate.isBefore(
          moment().subtract(10, "minutes"),
        );

      if (!updateRequired) {
        return characterDataDto;
      }

      await interaction.editReply({
        content:
          `${loadingEmote} Updating lodestone data. This might take several seconds.`,
        components: [],
        files: [],
        embeds: [],
        attachments: [],
      });

      const character = await FfxivUtil.getCharacterById(characterId);
      if (!character) return characterDataDto;

      const now = Date.now();
      const nowSQL = moment(now).tz("UTC").toDate();

      await db
        .insert(characterData)
        .values({
          characterId,
          latestUpdate: nowSQL,
          jsonString: JSON.stringify(character),
        })
        .onDuplicateKeyUpdate({
          set: {
            latestUpdate: nowSQL,
            jsonString: drizzleSql`VALUES(json_string)`,
          },
        });

      characterDataDto = new CharacterDataDto(moment(now), character);

      return characterDataDto;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Fetching character was NOT successful. Error: ${err.message}`,
        err,
      );
      return undefined;
    }
  }

  static async getCharacter(
    userId: string,
  ): Promise<{ id: number; name: string; server: any } | undefined> {
    try {
      const verification = await db
        .select({ characterId: verifications.characterId })
        .from(verifications)
        .where(eq(verifications.userId, userId))
        .limit(1);

      if (!verification[0]) return undefined;

      const characterId = verification[0].characterId;

      const charData = await db
        .select({ jsonString: characterData.jsonString })
        .from(characterData)
        .where(eq(characterData.characterId, characterId))
        .limit(1);

      const parsedCharacterData = charData[0]
        ? JSON.parse(charData[0].jsonString!)
        : undefined;

      return {
        id: parseInt(characterId),
        name: parsedCharacterData?.name,
        server: parsedCharacterData?.server,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        ConsoleUtil.logError(
          `Getting character was NOT successful. Error: ${err.message}`,
          err,
        );
      }
      return undefined;
    }
  }

  ////////////////////////////////////////////
  // Profile Pages
  ////////////////////////////////////////////

  static async getProfilePages(
    userId: string,
  ): Promise<{ profilePage: string; subProfilePage: string | null }> {
    try {
      const result = await db
        .select()
        .from(profilePages)
        .where(eq(profilePages.userId, userId))
        .limit(1);

      return result[0]
        ? {
          profilePage: result[0].profilePage!,
          subProfilePage: result[0].subProfilePage,
        }
        : { profilePage: "profile", subProfilePage: null };
    } catch (err: any) {
      ConsoleUtil.logError(`Getting profile page was NOT successful.`, err);
      return { profilePage: "profile", subProfilePage: null };
    }
  }

  static async updateProfilePage(
    userId: string,
    profilePage: string,
    subProfilePage: string | null,
  ): Promise<boolean> {
    try {
      const existing = await db
        .select({ userId: profilePages.userId })
        .from(profilePages)
        .where(eq(profilePages.userId, userId))
        .limit(1);

      if (existing[0]) {
        await db
          .update(profilePages)
          .set({ profilePage, subProfilePage })
          .where(eq(profilePages.userId, userId));
      } else {
        await db.insert(profilePages).values({
          userId,
          profilePage,
          subProfilePage,
        });
      }

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(`Updating profile page was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Theme
  ////////////////////////////////////////////

  static async getTheme(userId: string): Promise<string> {
    try {
      const result = await db
        .select({ theme: themes.theme })
        .from(themes)
        .where(eq(themes.userId, userId))
        .limit(1);

      return result[0]?.theme ?? "dark";
    } catch (err: any) {
      ConsoleUtil.logError(`Getting theme was NOT successful.`, err);
      return "dark";
    }
  }

  static async setTheme(userId: string, theme: string): Promise<boolean> {
    try {
      const existing = await db
        .select({ userId: themes.userId })
        .from(themes)
        .where(eq(themes.userId, userId))
        .limit(1);

      if (existing[0]) {
        await db.update(themes).set({ theme }).where(eq(themes.userId, userId));
      } else {
        await db.insert(themes).values({ userId, theme });
      }

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(`Setting theme was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Topic
  ////////////////////////////////////////////

  static async getTopicByTitle(
    title: string,
    date: Date,
  ): Promise<TopicData | undefined> {
    try {
      const dateSQL = moment(date).tz("Europe/London").toDate();

      const result = await db
        .select()
        .from(topicData)
        .where(and(eq(topicData.title, title), eq(topicData.date, dateSQL)))
        .limit(1);

      return result[0];
    } catch (err: any) {
      ConsoleUtil.logError(`Getting topic by title was NOT successful.`, err);
      return undefined;
    }
  }

  static async addTopic(
    topic: { title: string; date: Date },
  ): Promise<boolean | "existant"> {
    try {
      if (!(await this.getTopicByTitle(topic.title, topic.date))) {
        const dateSQL = moment(topic.date).tz("Europe/London").toDate();

        await db.insert(topicData).values({
          title: topic.title,
          date: dateSQL,
        });

        return true;
      }
      return "existant";
    } catch (err: any) {
      ConsoleUtil.logError(`Adding topic was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Notices
  ////////////////////////////////////////////

  static async getNoticeByTitle(
    title: string,
    date: Date,
  ): Promise<NoticeData | undefined> {
    try {
      const dateSQL = moment(date).tz("Europe/London").toDate();

      const result = await db
        .select()
        .from(noticeData)
        .where(and(eq(noticeData.title, title), eq(noticeData.date, dateSQL)))
        .limit(1);

      return result[0];
    } catch (err: any) {
      ConsoleUtil.logError(`Getting notice by title was NOT successful.`, err);
      return undefined;
    }
  }

  static async addNotices(notice: {
    title: string;
    tag: string;
    date: Date;
    link: string;
    details: string;
  }): Promise<boolean | "existant"> {
    try {
      if (!(await this.getNoticeByTitle(notice.title, notice.date))) {
        const dateSQL = moment(notice.date).tz("Europe/London").toDate();

        await db.insert(noticeData).values({
          title: notice.title,
          tag: notice.tag,
          date: dateSQL,
          link: notice.link,
          details: notice.details,
        });

        return true;
      }
      return "existant";
    } catch (err: any) {
      ConsoleUtil.logError(`Adding notice was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Maintenance
  ////////////////////////////////////////////

  static async getCurrentMaintenances(): Promise<
    MaintenanceData[] | undefined
  > {
    try {
      const now = moment().tz("Europe/London").toDate();

      const result = await db
        .select()
        .from(maintenanceData)
        .where(
          and(lte(maintenanceData.mFrom, now), gte(maintenanceData.mTo, now)),
        )
        .orderBy(desc(maintenanceData.id));

      return result.length > 0 ? result : undefined;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Getting current maintenances was NOT successful.`,
        err,
      );
      return undefined;
    }
  }

  static async getMaintenanceByTitle(
    title: string,
    date: Date,
  ): Promise<MaintenanceData | undefined> {
    try {
      const dateSQL = moment(date).tz("Europe/London").toDate();

      const result = await db
        .select()
        .from(maintenanceData)
        .where(
          and(
            eq(maintenanceData.title, title),
            eq(maintenanceData.date, dateSQL),
          ),
        )
        .limit(1);

      return result[0];
    } catch (err: any) {
      ConsoleUtil.logError(
        `Getting maintenance by title was NOT successful.`,
        err,
      );
      return undefined;
    }
  }

  static async addMaintenance(maintenance: {
    title: string;
    tag: string;
    date: Date;
    link: string;
    details: string;
    from: any;
    to: any;
  }): Promise<boolean | "existant"> {
    try {
      if (
        !(await this.getMaintenanceByTitle(maintenance.title, maintenance.date))
      ) {
        const dateSQL = moment(maintenance.date).tz("Europe/London").toDate();
        const fromSQL = maintenance.from
          ? moment(maintenance.from).tz("Europe/London").toDate()
          : null;
        const toSQL = maintenance.to
          ? moment(maintenance.to).tz("Europe/London").toDate()
          : null;

        await db.insert(maintenanceData).values({
          title: maintenance.title,
          tag: maintenance.tag,
          date: dateSQL,
          link: maintenance.link,
          details: maintenance.details,
          mFrom: fromSQL,
          mTo: toSQL,
        });

        return true;
      }
      return "existant";
    } catch (err: any) {
      ConsoleUtil.logError(`Adding maintenance was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Updates
  ////////////////////////////////////////////

  static async getUpdateByTitle(
    title: string,
    date: Date,
  ): Promise<UpdateData | undefined> {
    try {
      const dateSQL = moment(date).tz("Europe/London").toDate();

      const result = await db
        .select()
        .from(updateData)
        .where(and(eq(updateData.title, title), eq(updateData.date, dateSQL)))
        .limit(1);

      return result[0];
    } catch (err: any) {
      ConsoleUtil.logError(`Getting update by title was NOT successful.`, err);
      return undefined;
    }
  }

  static async addUpdate(update: {
    title: string;
    date: Date;
    link: string;
    details: string;
  }): Promise<boolean | "existant"> {
    try {
      if (!(await this.getUpdateByTitle(update.title, update.date))) {
        const dateSQL = moment(update.date).tz("Europe/London").toDate();

        await db.insert(updateData).values({
          title: update.title,
          date: dateSQL,
          link: update.link,
          details: update.details,
        });

        return true;
      }
      return "existant";
    } catch (err: any) {
      ConsoleUtil.logError(`Adding update was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Status
  ////////////////////////////////////////////

  static async getStatusByTitle(
    title: string,
    date: Date,
  ): Promise<StatusData | undefined> {
    try {
      const dateSQL = moment(date).tz("Europe/London").toDate();

      const result = await db
        .select()
        .from(statusData)
        .where(and(eq(statusData.title, title), eq(statusData.date, dateSQL)))
        .limit(1);

      return result[0];
    } catch (err: any) {
      ConsoleUtil.logError(`Getting status by title was NOT successful.`, err);
      return undefined;
    }
  }

  static async addStatus(status: {
    title: string;
    tag: string;
    date: Date;
    link: string;
    details: string;
  }): Promise<boolean | "existant"> {
    try {
      if (!(await this.getStatusByTitle(status.title, status.date))) {
        const dateSQL = moment(status.date).tz("Europe/London").toDate();

        await db.insert(statusData).values({
          title: status.title,
          tag: status.tag,
          date: dateSQL,
          link: status.link,
          details: status.details,
        });

        return true;
      }
      return "existant";
    } catch (err: any) {
      ConsoleUtil.logError(`Adding status was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Setup
  ////////////////////////////////////////////

  static async getSetups(type: string): Promise<Setup[] | undefined> {
    try {
      const result = await db.select().from(setups).where(
        eq(setups.type, type),
      );

      return result;
    } catch (err: any) {
      ConsoleUtil.logError(`Getting setups was NOT successful.`, err);
      return undefined;
    }
  }

  static async getSetupChannelId(
    guildId: string,
    type: string,
  ): Promise<string | undefined> {
    try {
      const result = await db
        .select({ channelId: setups.channelId })
        .from(setups)
        .where(and(eq(setups.guildId, guildId), eq(setups.type, type)))
        .limit(1);

      return result[0]?.channelId;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Getting ${type} channel ID was NOT successful.`,
        err,
      );
      return undefined;
    }
  }

  static async setSetupChannelId(
    guildId: string,
    type: string,
    channelId: string,
  ): Promise<boolean> {
    try {
      const existing = await this.getSetupChannelId(guildId, type);

      if (existing) {
        await db
          .update(setups)
          .set({ channelId })
          .where(and(eq(setups.guildId, guildId), eq(setups.type, type)));
      } else {
        await db.insert(setups).values({
          guildId,
          type,
          channelId,
        });
      }

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Setting ${type} channel ID was NOT successful.`,
        err,
      );
      return false;
    }
  }

  static async unsetSetupChannelId(
    guildId: string,
    type: string,
  ): Promise<boolean> {
    try {
      await db.delete(setups).where(
        and(eq(setups.guildId, guildId), eq(setups.type, type)),
      );

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(
        `Unsetting ${type} channel ID was NOT successful.`,
        err,
      );
      return false;
    }
  }

  ////////////////////////////////////////////
  // Setup - Purge
  ////////////////////////////////////////////

  static async purgeGuild(guildId: string): Promise<boolean> {
    try {
      await db.delete(setups).where(eq(setups.guildId, guildId));

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(`Guild purge was NOT successful.`, err);
      return false;
    }
  }

  ////////////////////////////////////////////
  // Purge
  ////////////////////////////////////////////

  static async purgeUser(
    userId: string,
    characterId: string,
  ): Promise<boolean> {
    try {
      await db.delete(characterData).where(
        eq(characterData.characterId, characterId),
      );

      await db.delete(socialMedias).where(
        eq(socialMedias.characterId, characterId),
      );

      await db.delete(favorites).where(eq(favorites.userId, userId));

      await db.delete(profilePages).where(eq(profilePages.userId, userId));

      await db.delete(themes).where(eq(themes.userId, userId));

      await db
        .delete(verifications)
        .where(
          and(
            eq(verifications.userId, userId),
            eq(verifications.characterId, characterId),
          ),
        );

      return true;
    } catch (err: any) {
      ConsoleUtil.logError(
        `User purge was NOT successful. Error: ${err.message}`,
        err,
      );
      return false;
    }
  }
}
