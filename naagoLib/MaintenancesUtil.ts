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

interface Maintenance {
  title: string;
  date: number;
  details: {
    html: string;
    markdown: string;
  };
  tag?: string;
  link: string;
  from?: string;
  to?: string;
}

interface Setup {
  guild_id: string;
  channel_id: string;
}

export default class MaintenancesUtil {
  static async getLast10(): Promise<Maintenance[]> {
    try {
      const res = await fetch(
        `http://${naagostoneHost}:${naagostonePort}/lodestone/maintenance`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data?.Maintenances ?? [];
    } catch (err: any) {
      console.log(`Getting maintenances failed: ${err.message}`);
      return [];
    }
  }

  static async updateDb(): Promise<number> {
    const latestMaintenances = await this.getLast10();
    const newMaintenances: Maintenance[] = [];

    for (const maint of latestMaintenances) {
      if (!maint) continue;

      maint.title = Parser.decodeHtmlChars(maint.title);
      maint.date = Parser.convertTimestampToMs(maint.date);

      // Only process new ones
      if (await DbUtil.getMaintenanceByTitle(maint.title, maint.date)) continue;

      // Tag
      maint.tag = maint.tag === "[Maintenance]" ? undefined : maint.tag;
      maint.tag = Parser.convertTag("maintenance", maint.tag);

      // Markdown is ready to use from API
      newMaintenances.push(maint);
    }

    for (const newMaint of newMaintenances.reverse()) {
      if (saveLodestoneNews) DbUtil.addMaintenance(newMaint);
      if (sendLodestoneNews) await MaintenancesUtil.sendMaint(newMaint);
    }

    return newMaintenances.length;
  }

  static async sendMaint(maint: Maintenance): Promise<void> {
    // Send embeds
    const client = GlobalUtil.client;
    if (!client) return;
    const setups: Setup[] = await DbUtil.getSetups("maintenances");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guild_id);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channel_id);
        if (!channel) continue;

        const embed = DiscordUtil.getMaintenanceEmbed(maint);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (err: any) {
        console.log(
          `[${
            moment().format(
              "YYYY-MM-DD HH:mm",
            )
          }] [MAINTENANCES] Sending maintenance to ${setup.guild_id} was NOT successful: ${err.message}`,
        );
        continue;
      }
    }
  }
}
