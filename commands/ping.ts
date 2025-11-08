import { SlashCommandBuilder, time } from "@discordjs/builders";
import {
  ChatInputCommandInteraction,
  ColorResolvable,
  EmbedBuilder,
} from "discord.js";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import moment from "moment";

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

    const color = await DiscordUtil.getBotColorByInteraction(
      interaction,
    ) as ColorResolvable;
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
      ephemeral: true,
    });
  },
};
