import { SlashCommandBuilder } from "@discordjs/builders";
import {
  ActionRow,
  ActionRowBuilder,
  ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
} from "discord.js";
import { APISelectMenuOption } from "discord-api-types/v10";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { ThemeRepository } from "../database/repository/ThemeRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { DiscordEmoteService } from "../service/DiscordEmoteService.ts";

export default {
  data: new SlashCommandBuilder()
    .setName("theme")
    .setDescription("Change the theme of the profiles you request."),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed(
        "Please verify your character first. See `/verify set`.",
      );
      await interaction.reply({ ephemeral: true, embeds: [embed] });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("theme")
        .setPlaceholder("Select a theme...")
        .addOptions([
          {
            label: "Dark UI",
            description: "The dark UI like in-game",
            value: "dark",
            emoji: await DiscordEmoteService.get(client, "theme_dark"),
          },
          {
            label: "Light UI",
            description: "The light UI like in-game",
            value: "light",
            emoji: await DiscordEmoteService.get(client, "theme_light"),
          },
          {
            label: "Classic UI",
            description: "The classic UI like in-game",
            value: "classic",
            emoji: await DiscordEmoteService.get(client, "theme_classic"),
          },
          {
            label: "Clear Blue UI",
            description: "The clear blue UI like in-game",
            value: "clear_blue",
            emoji: await DiscordEmoteService.get(client, "theme_clear_blue"),
          },
          {
            label: "Character Selection",
            description: "Background from character selection",
            value: "character_selection",
            emoji: await DiscordEmoteService.get(
              client,
              "theme_character_selection",
            ),
          },
          {
            label: "Amaurot",
            description: "Amaurot projection from the Tempest",
            value: "amaurot",
            emoji: await DiscordEmoteService.get(client, "theme_amaurot"),
          },
          {
            label: "The Moon",
            description: "Landscape on Mare Lamentorum",
            value: "moon",
            emoji: await DiscordEmoteService.get(client, "theme_moon"),
          },
          {
            label: "The Final Days",
            description: "Fiery star showers",
            value: "final_days",
            emoji: await DiscordEmoteService.get(client, "theme_final_days"),
          },
          {
            label: "Ultima Thule",
            description: "At the edge of the universe",
            value: "ultima_thule",
            emoji: await DiscordEmoteService.get(client, "theme_ultima_thule"),
          },
        ]),
    );

    await interaction.editReply({
      content: "Which theme do you prefer?",
      components: [row],
    });
  },

  async update(interaction: StringSelectMenuInteraction) {
    const userId = interaction.user.id;
    const theme = interaction.values[0];
    const messageRow = interaction.message.components[0] as ActionRow<
      StringSelectMenuComponent
    >;
    const selectMenu = messageRow.components[0] as StringSelectMenuComponent;
    const themeName = selectMenu.options?.find(
      (option: APISelectMenuOption) => option.value === theme,
    )?.label ?? theme;

    try {
      await ThemeRepository.set(userId, theme);
    } catch (_error: unknown) {
      const embed = DiscordEmbedService.getErrorEmbed(
        `Theme could not be set to \`${themeName}\`. Please contact Tancred#0001 for help.`,
      );

      interaction.editReply({
        content: " ",
        components: [],
        embeds: [embed],
      });

      return;
    }

    const embed = DiscordEmbedService.getSuccessEmbed(
      `Your theme was set to \`${themeName}\`.`,
    );

    interaction.editReply({
      content: " ",
      components: [],
      embeds: [embed],
    });
  },
};
