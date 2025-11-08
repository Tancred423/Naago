import NaagoUtil from "./NaagoUtil.ts";
import DiscordUtil from "./DiscordUtil.ts";
import DbUtil from "./DbUtil.ts";
import GlobalUtil from "./GlobalUtil.ts";
import Parser from "./LodestoneParser.ts";
import moment from "npm:moment@^2.30.1";
import type { TextChannel } from "npm:discord.js@^13.17.1";

const naagostoneHost = Deno.env.get("NAAGOSTONE_HOST") || "localhost";
const naagostonePort = Deno.env.get("NAAGOSTONE_PORT")!;
const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

interface Topic {
  title: string;
  date: number;
  description: {
    html: string;
    markdown: string;
  };
  link: string;
  banner?: string;
  tag?: string;
}

interface Setup {
  guild_id: string;
  channel_id: string;
}

export default class TopicsUtil {
  static async getLast10(): Promise<Topic[]> {
    try {
      const res = await fetch(
        `http://${naagostoneHost}:${naagostonePort}/lodestone/topics`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data?.Topics ?? [];
    } catch (err: any) {
      console.log(`Getting topics failed: ${err.message}`);
      return [];
    }
  }

  static async updateDb(): Promise<number> {
    const latestTopics = await this.getLast10();
    const newTopics: Topic[] = [];

    for (const topic of latestTopics) {
      if (!topic) continue;

      topic.title = Parser.decodeHtmlChars(topic.title);
      topic.date = Parser.convertTimestampToMs(topic.date);

      // Only process new ones
      if (await DbUtil.getTopicByTitle(topic.title, topic.date)) continue;

      // Markdown is ready to use from API
      newTopics.push(topic);
    }

    for (const newTopic of newTopics.reverse()) {
      if (saveLodestoneNews) DbUtil.addTopic(newTopic);
      if (sendLodestoneNews) await TopicsUtil.sentTopic(newTopic);
    }

    return newTopics.length;
  }

  static async sentTopic(topic: Topic): Promise<void> {
    // Send embeds
    const client = GlobalUtil.client;

    if (!client) {
      console.log(
        `[${
          moment().format(
            "YYYY-MM-DD HH:mm",
          )
        }] [TOPICS] Sending topics was NOT successful because client is null!`,
      );

      return;
    }

    const setups: Setup[] = await DbUtil.getSetups("topics");

    if (!setups || setups?.length < 1) {
      console.log(
        `[${
          moment().format(
            "YYYY-MM-DD HH:mm",
          )
        }] [TOPICS] Sending topics was NOT successful because setups cannot be found! | Is setups null: ${!setups} | Is setups not null but empty: ${
          setups?.length < 1 ? "null..." : setups?.length
        }`,
      );

      return;
    }

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id);

        if (!guild) {
          console.log(
            `[${
              moment().format(
                "YYYY-MM-DD HH:mm",
              )
            }] [TOPICS] Sending topic to ${setup.guild_id} was NOT successful because could not fetch guild.`,
          );

          continue;
        }

        const channel = await guild.channels.fetch(setup.channel_id);

        if (!channel) {
          console.log(
            `[${
              moment().format(
                "YYYY-MM-DD HH:mm",
              )
            }] [TOPICS] Sending topic to ${setup.guild_id} was NOT successful because could not fetch channel with id ${setup.channel_id}.`,
          );

          continue;
        }

        const embed = DiscordUtil.getTopicEmbed(topic);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (err: any) {
        console.log(
          `[${
            moment().format("YYYY-MM-DD HH:mm")
          }] [TOPICS] Sending topic to ${setup.guild_id} was NOT successful: ${err.message}`,
          err,
        );

        continue;
      }
    }
  }
}
