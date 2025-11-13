import {
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionsBitField,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { SetupsRepository } from "../database/repository/SetupsRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { VerificationsRepository } from "../database/repository/VerificationsRepository.ts";
import { DiscordEmojiService } from "../service/DiscordEmojiService.ts";
import { Command } from "./type/Command.ts";
import { InvalidSubCommandError } from "./error/InvalidSubCommandError.ts";

class SetupCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup M'naago.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lodestone")
        .setDescription("Set up which channels receive automated Lodestone news updates.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("theme")
        .setDescription("Set a theme for your verified character's profile.")
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels);

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const subCommand = interaction.options.getSubcommand();
    switch (subCommand) {
      case "lodestone":
        await this.handleLodestone(interaction);
        break;
      case "theme":
        await this.handleTheme(interaction);
        break;
      default:
        throw new InvalidSubCommandError(`/setup ${subCommand}`);
    }
  }

  private async handleLodestone(interaction: ChatInputCommandInteraction): Promise<void> {
    const guildId = interaction.guild!.id;
    const setups = await SetupsRepository.getAllByGuildId(guildId);
    const setupMap = Object.fromEntries(setups.map((setup) => [setup.type, setup]));
    const {
      topic: currentTopicChannel,
      notice: currentNoticeChannel,
      maintenance: currentMaintenanceChannel,
      update: currentUpdateChannel,
      status: currentStatusChannel,
    } = setupMap;

    const topicChannelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("setup_topics_channel_select")
      .setPlaceholder("Channel to post topics in...")
      .setChannelTypes(ChannelType.GuildText)
      .setRequired(false);
    if (currentTopicChannel) {
      topicChannelMenu.setDefaultChannels(currentTopicChannel.channelId);
    }
    const topicRow = new LabelBuilder()
      .setLabel("Topics (Latest news, PLL's and patch notes)")
      .setChannelSelectMenuComponent(topicChannelMenu);

    const noticeChannelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("setup_notice_channel_select")
      .setPlaceholder("Channel to post notices in...")
      .setChannelTypes(ChannelType.GuildText)
      .setRequired(false);
    if (currentNoticeChannel) {
      noticeChannelMenu.setDefaultChannels(currentNoticeChannel.channelId);
    }
    const noticeRow = new LabelBuilder()
      .setLabel("Notices (Secondary news)")
      .setChannelSelectMenuComponent(noticeChannelMenu);

    const maintenanceChannelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("setup_maintenance_channel_select")
      .setPlaceholder("Channel to post maintenances in...")
      .setChannelTypes(ChannelType.GuildText)
      .setRequired(false);
    if (currentMaintenanceChannel) {
      maintenanceChannelMenu.setDefaultChannels(currentMaintenanceChannel.channelId);
    }
    const maintenanceRow = new LabelBuilder()
      .setLabel("Maintenances (And their durations)")
      .setChannelSelectMenuComponent(maintenanceChannelMenu);

    const updateChannelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("setup_update_channel_select")
      .setPlaceholder("Channel to post updates in...")
      .setChannelTypes(ChannelType.GuildText)
      .setRequired(false);
    if (currentUpdateChannel) {
      updateChannelMenu.setDefaultChannels(currentUpdateChannel.channelId);
    }
    const updateRow = new LabelBuilder()
      .setLabel("Updates (Outcome from maintenances)")
      .setChannelSelectMenuComponent(updateChannelMenu);

    const statusChannelMenu = new ChannelSelectMenuBuilder()
      .setCustomId("setup_status_channel_select")
      .setPlaceholder("Channel to post statuses in...")
      .setChannelTypes(ChannelType.GuildText)
      .setRequired(false);
    if (currentStatusChannel) {
      statusChannelMenu.setDefaultChannels(currentStatusChannel.channelId);
    }
    const statusRow = new LabelBuilder()
      .setLabel("Statuses (Tech. difficulties & server status)")
      .setChannelSelectMenuComponent(statusChannelMenu);

    const modal = new ModalBuilder()
      .setCustomId("setup.lodestone")
      .setTitle("Lodestone News Channels")
      .addLabelComponents(topicRow, noticeRow, maintenanceRow, updateRow, statusRow);

    await interaction.showModal(modal);
  }

  private async handleTheme(interaction: ChatInputCommandInteraction): Promise<void> {
    const userId = interaction.user.id;
    const verification = await VerificationsRepository.find(userId);

    if (!verification?.isVerified) {
      const embed = DiscordEmbedService.getErrorEmbed("Please verify your character first. See `/verify add`.");
      await interaction.reply({ flags: MessageFlags.Ephemeral, embeds: [embed] });
      return;
    }

    const darkEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_DARK");
    const lightEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_LIGHT");
    const classicEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CLASSIC");
    const clearBlueEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CLEAR_BLUE");
    const characterSelectionEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_CHARACTER_SELECTION");
    const amaurotEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_AMAUROT");
    const moonEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_MOON");
    const theFinalDaysEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_THE_FINAL_DAYS");
    const ultimaThuleEmoji = DiscordEmojiService.getAsEmojiData("EMOJI_THEME_ULTIMA_THULE");

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("theme_select")
      .setPlaceholder("Select a theme...")
      .addOptions([
        {
          label: "Dark UI",
          description: "The dark UI like in-game",
          value: "dark",
          ...(darkEmoji && { emoji: darkEmoji }),
        },
        {
          label: "Light UI",
          description: "The light UI like in-game",
          value: "light",
          ...(lightEmoji && { emoji: lightEmoji }),
        },
        {
          label: "Classic UI",
          description: "The classic UI like in-game",
          value: "classic",
          ...(classicEmoji && { emoji: classicEmoji }),
        },
        {
          label: "Clear Blue UI",
          description: "The clear blue UI like in-game",
          value: "clear_blue",
          ...(clearBlueEmoji && { emoji: clearBlueEmoji }),
        },
        {
          label: "Character Selection",
          description: "Background from character selection",
          value: "character_selection",
          ...(characterSelectionEmoji && { emoji: characterSelectionEmoji }),
        },
        {
          label: "Amaurot",
          description: "Amaurot projection from the Tempest",
          value: "amaurot",
          ...(amaurotEmoji && { emoji: amaurotEmoji }),
        },
        {
          label: "The Moon",
          description: "Landscape on Mare Lamentorum",
          value: "moon",
          ...(moonEmoji && { emoji: moonEmoji }),
        },
        {
          label: "The Final Days",
          description: "Fiery star showers",
          value: "final_days",
          ...(theFinalDaysEmoji && { emoji: theFinalDaysEmoji }),
        },
        {
          label: "Ultima Thule",
          description: "At the edge of the universe",
          value: "ultima_thule",
          ...(ultimaThuleEmoji && { emoji: ultimaThuleEmoji }),
        },
      ]);

    const row = new LabelBuilder()
      .setLabel("Which theme do you prefer?")
      .setStringSelectMenuComponent(selectMenu);

    const modal = new ModalBuilder()
      .setCustomId(`setup.theme.modal.${verification.characterId}`)
      .setTitle("Select Theme")
      .addLabelComponents(row);

    await interaction.showModal(modal);
  }
}

export default new SetupCommand();
