import moment from "moment";
import { TextChannel } from "discord.js";
import { StringManipulationService } from "./StringManipulationService.ts";
import * as log from "@std/log";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Status } from "../naagostone/type/Status.ts";
import { StatusesRepository } from "../database/repository/StatusesRepository.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export default class StatusSenderService {
  static async checkForNew(): Promise<number> {
    const latestStatuses = await NaagostoneApiService.fetchLatest10Statuses();
    const newStatuses: Status[] = [];

    for (const status of latestStatuses) {
      if (!status) continue;

      const date = moment(status.date).tz("Europe/London").toDate();
      if (await StatusesRepository.find(status.title, date)) continue;

      status.tag = StringManipulationService.convertTag("status", status.tag);

      newStatuses.push(status);
    }

    for (const newStatus of newStatuses.reverse()) {
      if (saveLodestoneNews) StatusesRepository.add(newStatus);
      if (sendLodestoneNews) await this.send(newStatus);
    }

    return newStatuses.length;
  }

  static async send(status: Status): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAll("status");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getStatusEmbed(status);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(
            `[STATUS] Sending status to ${setup.guildId} was NOT successful: ${error.message}`,
          );
        }
        continue;
      }
    }
  }
}
