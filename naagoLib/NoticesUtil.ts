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

interface Notice {
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

export default class NoticesUtil {
  static async getLast10(): Promise<Notice[]> {
    try {
      const res = await fetch(
        `http://${naagostoneHost}:${naagostonePort}/lodestone/notices`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data?.Notices ?? [];
    } catch (err: any) {
      console.log(`Getting notices failed: ${err.message}`);
      return [];
    }
  }

  static async updateDb(): Promise<number> {
    const latestNotices = await this.getLast10();
    const newNotices: Notice[] = [];

    for (const notice of latestNotices) {
      if (!notice) continue;

      notice.title = notice.title ? notice.title : notice.title_full!;
      notice.title = Parser.decodeHtmlChars(notice.title);
      notice.date = Parser.convertTimestampToMs(notice.date);

      // Only process new ones
      if (await DbUtil.getNoticeByTitle(notice.title, notice.date)) continue;

      // Tag
      notice.tag = Parser.convertTag("notice", notice.tag);

      // Markdown is ready to use from API
      newNotices.push(notice);
    }

    for (const newNotice of newNotices.reverse()) {
      if (saveLodestoneNews) DbUtil.addNotices(newNotice);
      if (sendLodestoneNews) await NoticesUtil.sendNotice(newNotice);
    }

    return newNotices.length;
  }

  static async sendNotice(notice: Notice): Promise<void> {
    // Send embeds
    const client = GlobalUtil.client;
    if (!client) return;
    const setups: Setup[] = await DbUtil.getSetups("notices");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channel_id);
        if (!channel) continue;

        const embed = DiscordUtil.getNoticesEmbed(notice);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (err: any) {
        console.log(
          `[${
            moment().format(
              "YYYY-MM-DD HH:mm",
            )
          }] [NOTICES] Sending notice to ${setup.guild_id} was NOT successful: ${err.message}`,
        );
        continue;
      }
    }
  }
}
