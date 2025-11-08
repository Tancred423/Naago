import { SlashCommandBuilder, time } from "@discordjs/builders";
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import moment from "moment";
import { DiscordColorService } from "../service/DiscordColorService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Bot's latency and uptime."),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const uptimeFormatted = time(
      moment().subtract(client.uptime!, "ms").toDate(),
      "R",
    );

    const color = await DiscordColorService.getBotColorByInteraction(
      interaction,
    );
    const embed = new EmbedBuilder()
      .setColor(color)
      .addFields([
        { name: "Ping", value: `${client.ws.ping} ms`, inline: true },
        { name: "Latest restart", value: uptimeFormatted, inline: true },
        {
          name: "Servers",
          value: (await client.guilds.fetch())?.size.toString(),
          inline: true,
        },
      ]);

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
