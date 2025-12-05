import moment from "moment";
import { TextChannel, time, TimestampStyles } from "discord.js";
import { Topic } from "../naagostone/type/Topic.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { TopicsRepository } from "../database/repository/TopicsRepository.ts";
import { GlobalClient } from "../index.ts";
import * as log from "@std/log";
import { Setup } from "../database/schema/setups.ts";
import { TopicData } from "../database/schema/lodestone-news.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export class TopicSenderService {
  public static async checkForNew(): Promise<number> {
    const latestTopics = await NaagostoneApiService.fetchLatest10Topics();
    const newTopics: Topic[] = [];

    for (const topic of latestTopics) {
      if (!topic) continue;

      const date = moment(topic.date).tz("Europe/London").toDate();
      if (await TopicsRepository.find(topic.title, date)) continue;

      newTopics.push(topic);
    }

    for (const newTopic of newTopics.reverse()) {
      if (saveLodestoneNews) await TopicsRepository.add(newTopic);
      if (sendLodestoneNews) await this.send(newTopic);
    }

    return newTopics.length;
  }

  public static async send(topic: Topic): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("topics");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getTopicEmbed(topic);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[TOPICS] Sending topic to ${setup.guildId} was NOT successful: ${error.stack}`);
        }
        continue;
      }
    }
  }

  public static async sendLiveLetterStartedAnnouncement(topic: TopicData): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    if (!topic.timestampLiveLetter) return;

    const setups: Setup[] = await SetupsRepository.getAllByType("topics");
    if (!setups || setups?.length < 1) return;

    const timestampFull = time(topic.timestampLiveLetter, TimestampStyles.LongDateTime);
    const timestampRelative = time(topic.timestampLiveLetter, TimestampStyles.RelativeTime);
    const content = `# This Live Letter is now live!\nIt started at ${timestampFull} (${timestampRelative})`;
    const embed = DiscordEmbedService.getTopicEmbedFromData(topic);

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        await (channel as TextChannel).send({ content, embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(`[LIVE LETTER] Sending announcement to ${setup.guildId} was NOT successful: ${error.stack}`);
        }
        continue;
      }
    }
  }
}
