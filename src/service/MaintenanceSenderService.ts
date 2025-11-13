import moment from "moment";
import { TextChannel } from "discord.js";
import { StringManipulationService } from "./StringManipulationService.ts";
import { NaagostoneApiService } from "../naagostone/service/NaagostoneApiService.ts";
import { Maintenance } from "../naagostone/type/Maintenance.ts";
import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { GlobalClient } from "../index.ts";
import { Setup } from "../database/schema/setups.ts";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "./DiscordEmbedService.ts";
import * as log from "@std/log";

const saveLodestoneNews = Deno.env.get("SAVE_LODESTONE_NEWS") === "true";
const sendLodestoneNews = Deno.env.get("SEND_LODESTONE_NEWS") === "true";

export class MaintenanceSenderService {
  static async checkForNew(): Promise<number> {
    const latestMaintenances = await NaagostoneApiService
      .fetchLatest10Maintenances();
    const newMaintenances: Maintenance[] = [];

    for (const maintenance of latestMaintenances) {
      if (!maintenance) continue;

      const date = moment(maintenance.date).tz("Europe/London").toDate();
      if (await MaintenancesRepository.find(maintenance.title, date)) continue;

      maintenance.tag = maintenance.tag === "[Maintenance]" ? null : maintenance.tag;
      maintenance.tag = StringManipulationService.convertTag(
        "maintenance",
        maintenance.tag ?? null,
      );

      newMaintenances.push(maintenance);
    }

    for (const maintenance of newMaintenances.reverse()) {
      if (saveLodestoneNews) await MaintenancesRepository.add(maintenance);
      if (sendLodestoneNews) await this.send(maintenance);
    }

    return newMaintenances.length;
  }

  private static async send(maintenance: Maintenance): Promise<void> {
    const client = GlobalClient.client;
    if (!client) return;
    const setups: Setup[] = await SetupsRepository.getAllByType("maintenances");
    if (!setups || setups?.length < 1) return;

    for (const setup of setups) {
      try {
        const guild = await client.guilds.fetch(setup.guildId);
        if (!guild) continue;
        const channel = await guild.channels.fetch(setup.channelId);
        if (!channel) continue;

        const embed = DiscordEmbedService.getMaintenanceEmbed(maintenance);

        await (channel as TextChannel).send({ embeds: [embed] });
      } catch (error: unknown) {
        if (error instanceof Error) {
          log.error(
            `[MAINTENANCES] Sending maintenance to ${setup.guildId} was NOT successful: ${error.message}`,
          );
        }
        continue;
      }
    }
  }
}
