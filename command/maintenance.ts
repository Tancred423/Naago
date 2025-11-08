import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";

import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("maintenance")
    .setDescription("Current FFXIV maintenance if any."),
  async execute(interaction: ChatInputCommandInteraction) {
    const activeMaintenances = await MaintenancesRepository.findActive();

    if (activeMaintenances.length === 0) {
      await interaction.reply({
        ephemeral: true,
        content: "There is no active maintenance.",
      });
    }

    const embeds = [];

    for (const maintenanceData of activeMaintenances) {
      if (embeds.length >= 10) break;
      embeds.push(
        DiscordEmbedService.getMaintenanceEmbedFromData(maintenanceData),
      );
    }

    const content = embeds.length > 1
      ? "These maintenances are currently active:"
      : "This maintenance is currently active:";

    await interaction.reply({ content: content, embeds: embeds });
  },
};
