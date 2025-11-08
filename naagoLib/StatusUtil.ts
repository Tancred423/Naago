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

interface Status {
  title: string;
  title_full?: string;
  date: number;
  details: {
    html: string;
    markdown: string;
  };
  tag: string;
  link: string;
}

interface Setup {
  guild_id: string;
  channel_id: string;
}

export default class StatusUtil {
  static async getLast10(): Promise<Status[]> {
    try {
      const res = await fetch(
        `http://${naagostoneHost}:${naagostonePort}/lodestone/statuses`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data?.Status ?? [];
    } catch (err: any) {
      console.log(`Getting status failed: ${err.message}`);
      return [];
    }
  }

  static async updateDb(): Promise<number> {
    const latestStatuses = await this.getLast10();
    const newStatuses: Status[] = [];

    for (const status of latestStatuses) {
      if (!status) continue;

      status.title = status.title ? status.title : status.title_full!;
      status.title = Parser.decodeHtmlChars(status.title);
      status.date = Parser.convertTimestampToMs(status.date);

      // Only process new ones
      if (await DbUtil.getStatusByTitle(status.title, status.date)) continue;

      // Tag
      status.tag = Parser.convertTag("status", status.tag);

      // Markdown is ready to use from API
      newStatuses.push(status);
    }

    for (const newStatus of newStatuses.reverse()) {
      if (saveLodestoneNews) DbUtil.addStatus(newStatus);
      if (sendLodestoneNews) await StatusUtil.sendStatus(newStatus);
    }

    return newStatuses.length;
  }

  static async sendStatus(status: Status): Promise<void> {
    // Send embeds
    const client = GlobalUtil.client;
    if (!client) return;
    const setups: Setup[] = await DbUtil.getSetups("status");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channel_id);
        if (!channel) continue;

        const embed = DiscordUtil.getStatusEmbed(status);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (err: any) {
        console.log(
          `[${
            moment().format(
              "YYYY-MM-DD HH:mm",
            )
          }] [STATUS] Sending status to ${setup.guild_id} was NOT successful: ${err.message}`,
        );
        continue;
      }
    }
  }
}
