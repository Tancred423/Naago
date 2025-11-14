import { ApplicationCommandType, AttachmentBuilder, ContextMenuCommandBuilder } from "discord.js";
import { ContextMenuCommandInteraction } from "discord.js";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { Command } from "./type/Command.ts";
import { DiscordMessageService } from "../service/DiscordMessageService.ts";

class ContextFindCommand extends Command {
  public readonly data = new ContextMenuCommandBuilder()
    .setName("Find")
    .setType(ApplicationCommandType.User);

  public async execute(interaction: ContextMenuCommandInteraction): Promise<void> {
    const isVerified = interaction.targetId === interaction.user.id;

    await interaction.deferReply();

    const targetCharacterDataDtoCached = await FetchCharacterService.findVerifiedCharacterByUserId(
      interaction.targetId,
    );

    if (!targetCharacterDataDtoCached) {
      await DiscordMessageService.editReplyError(interaction, "This user does not have a verified character.");
      return;
    }

    const targetCharacterCached = targetCharacterDataDtoCached.character;
    const targetCharacterDataDto = await FetchCharacterService.fetchCharacterCached(
      interaction,
      targetCharacterCached.id,
    );

    if (!targetCharacterDataDto) {
      await DiscordMessageService.editReplyError(interaction, "Unable to fetch character. Please try again later.");
      return;
    }

    const targetCharacter = targetCharacterDataDto.character;
    const profileImage = await ProfileGeneratorService.getImage(targetCharacter, isVerified, "profile");

    if (!profileImage) {
      await DiscordMessageService.editReplyError(
        interaction,
        "Unable to generate profile image. Please try again later.",
      );
    }

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents("profile", null, "profile", targetCharacter?.id);
    const unix = targetCharacterDataDto.latestUpdate.unix();

    await interaction.editReply({
      content: `Latest Update: <t:${unix}:R>`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  }
}

export default new ContextFindCommand();
