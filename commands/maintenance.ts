import { SlashCommandBuilder } from "@discordjs/builders";
import type { ChatInputCommandInteraction } from "discord.js";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import DbUtil from "../naagoLib/DbUtil.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("maintenance")
    .setDescription("Current FFXIV maintenance if any."),
  async execute(interaction: ChatInputCommandInteraction) {
    const maints = await DbUtil.getCurrentMaintenances();

    if (maints) {
      const embeds = [];

      for (const maint of maints) {
        if (embeds.length >= 10) break;
        embeds.push(DiscordUtil.getMaintenanceEmbed(maint));
      }

      const content = embeds.length > 1
        ? "These maintenances are currently active:"
        : "This maintenance is currently active:";

      await interaction.reply({ content: content, embeds: embeds });
    } else {
      await interaction.reply({
        ephemeral: true,
        content: "There is no active maintenance.",
      });
    }
  },
};
