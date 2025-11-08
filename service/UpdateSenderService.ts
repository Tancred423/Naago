import moment from "moment";
import { TextChannel } from "discord.js";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Update } from "../naagostone/type/Updates.ts";
import { UpdatesRepository } from "../database/repository/UpdatesRepository.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export class UpdateSenderService {
  static async checkForNew(): Promise<number> {
    const latestUpdates = await NaagostoneApiService.fetchLatest10Updates();
    const newUpdates: Update[] = [];

    for (const update of latestUpdates) {
      if (!update) continue;

      const date = moment(update.date).tz("Europe/London").toDate();
      if (await UpdatesRepository.find(update.title, date)) continue;

      newUpdates.push(update);
    }

    for (const newUpdate of newUpdates.reverse()) {
      if (saveLodestoneNews) UpdatesRepository.add(newUpdate);
      if (sendLodestoneNews) await this.send(newUpdate);
    }

    return newUpdates.length;
  }

  static async send(update: Update): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAll("updates");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getUpdatesEmbed(update);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(
            `[UPDATES] Sending update to ${setup.guildId} was NOT successful: ${error.message}`,
          );
        }
        continue;
      }
    }
  }
}
