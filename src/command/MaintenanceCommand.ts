import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { Command } from "./type/Command.ts";

class MaintenanceCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("maintenance")
    .setDescription("Current maintenances if any.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const activeMaintenances = await MaintenancesRepository.findActive();

    if (activeMaintenances.length === 0) {
      await interaction.reply({ content: "There is no active maintenance." });
      return;
    }

    const embeds = [];

    for (const maintenanceData of activeMaintenances) {
      if (embeds.length >= 10) break;
      embeds.push(DiscordEmbedService.getMaintenanceEmbedFromData(maintenanceData));
    }

    const content = embeds.length > 1
      ? "# These maintenances are currently active"
      : "# This maintenance is currently active";

    await interaction.reply({ content: content, embeds: embeds });
  }
}

export default new MaintenanceCommand();
