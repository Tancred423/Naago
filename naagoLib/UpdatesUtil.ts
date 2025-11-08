import DbUtil from "./DbUtil.ts";
import moment from "npm:moment@^2.30.1";
import DiscordUtil from "./DiscordUtil.ts";
import NaagoUtil from "./NaagoUtil.ts";
import GlobalUtil from "./GlobalUtil.ts";
import Parser from "./LodestoneParser.ts";
import type { TextChannel } from "npm:discord.js@^13.17.1";

const naagostoneHost = Deno.env.get("NAAGOSTONE_HOST") || "localhost";
const naagostonePort = Deno.env.get("NAAGOSTONE_PORT")!;
const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

interface Update {
  title: string;
  date: number;
  details: {
    html: string;
    markdown: string;
  };
  link: string;
}

interface Setup {
  guild_id: string;
  channel_id: string;
}

export default class UpdatesUtil {
  static async getLast10(): Promise<Update[]> {
    try {
      const res = await fetch(
        `http://${naagostoneHost}:${naagostonePort}/lodestone/updates`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data?.Updates ?? [];
    } catch (err: any) {
      console.log(`Getting updates failed: ${err.message}`);
      return [];
    }
  }

  static async updateDb(): Promise<number> {
    const latestUpdates = await this.getLast10();
    const newUpdates: Update[] = [];

    for (const update of latestUpdates) {
      if (!update) continue;

      update.title = Parser.decodeHtmlChars(update.title);
      update.date = Parser.convertTimestampToMs(update.date);

      // Only process new ones
      if (await DbUtil.getUpdateByTitle(update.title, update.date)) continue;

      // Markdown is ready to use from API
      newUpdates.push(update);
    }

    for (const newUpdate of newUpdates.reverse()) {
      if (saveLodestoneNews) DbUtil.addUpdate(newUpdate);
      if (sendLodestoneNews) await UpdatesUtil.sendUpdate(newUpdate);
    }

    return newUpdates.length;
  }

  static async sendUpdate(update: Update): Promise<void> {
    // Send embeds
    const client = GlobalUtil.client;
    if (!client) return;
    const setups: Setup[] = await DbUtil.getSetups("updates");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channel_id);
        if (!channel) continue;

        const embed = DiscordUtil.getUpdatesEmbed(update);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (err: any) {
        console.log(
          `[${
            moment().format(
              "YYYY-MM-DD HH:mm",
            )
          }] [UPDATES] Sending update to ${setup.guild_id} was NOT successful: ${err.message}`,
        );
        continue;
      }
    }
  }
}
