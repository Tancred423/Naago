import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v10";
import { AttachmentBuilder } from "discord.js";
import { ContextMenuCommandInteraction } from "discord.js";
import { ProfileGeneratorService } from "../service/ProfileGeneratorService.ts";
import { FetchCharacterService } from "../service/FetchCharacterService.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Find")
    .setType(ApplicationCommandType.User),
  async execute(interaction: ContextMenuCommandInteraction) {
    const isVerified = interaction.targetId === interaction.user.id;
    const targetCharacterDataDtoCached = await FetchCharacterService
      .findVerifiedCharacterByUserId(interaction.targetId);
    if (!targetCharacterDataDtoCached) {
      await sendError(
        interaction,
        "This user does not have a verified character.",
      );
      return;
    }
    const targetCharacterCached = targetCharacterDataDtoCached.character;

    await interaction.deferReply();

    const targetCharacterDataDto = await FetchCharacterService
      .fetchCharacterCached(
        interaction,
        targetCharacterCached.id,
      );
    if (!targetCharacterDataDto) {
      await sendError(
        interaction,
        "Unable to fetch character. Please try again later.",
      );
      return;
    }
    const targetCharacter = targetCharacterDataDto.character;

    const profileImage = await ProfileGeneratorService.getImage(
      interaction,
      targetCharacter,
      isVerified,
      "profile",
    );
    if (!profileImage) {
      await sendError(
        interaction,
        "Unable to generate profile image. Please try again later.",
      );
    }

    const file = new AttachmentBuilder(profileImage);
    const components = ProfileGeneratorService.getComponents(
      "profile",
      null,
      "find",
      targetCharacter?.id,
    );

    const unix = targetCharacterDataDto.latestUpdate.unix();
    await interaction.editReply({
      content: `Latest Update: <t:${unix}:R>`,
      files: [file],
      embeds: [],
      attachments: [],
      components: components,
    });
  },
};

async function sendError(
  interaction: ContextMenuCommandInteraction,
  message: string,
): Promise<void> {
  const embed = DiscordEmbedService.getErrorEmbed(message);

  await interaction.editReply({
    content: " ",
    embeds: [embed],
  });
}
