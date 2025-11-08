import { ContextMenuCommandBuilder } from "@discordjs/builders";
import { ApplicationCommandType } from "discord-api-types/v10";
import { AttachmentBuilder } from "discord.js";
import type { ContextMenuCommandInteraction } from "discord.js";
import DbUtil from "../naagoLib/DbUtil.ts";
import DiscordUtil from "../naagoLib/DiscordUtil.ts";
import ProfileUtil from "../naagoLib/ProfileUtil.ts";

export default {
  data: new ContextMenuCommandBuilder()
    .setName("Find")
    .setType(ApplicationCommandType.User),
  async execute(interaction: ContextMenuCommandInteraction) {
    const isVerified = interaction.targetId === interaction.user.id;
    const characterCache = await DbUtil.getCharacter(interaction.targetId);

    if (!characterCache) {
      await sendError(
        interaction,
        "This user does not have a verified character.",
      );
      return;
    }

    await interaction.deferReply();

    const characterDataDto = await DbUtil.fetchCharacter(
      interaction,
      characterCache.id,
    );
    const character = characterDataDto.characterData;

    const profileImage = await ProfileUtil.getImage(
      interaction,
      character,
      isVerified,
      "profile",
    );

    if (!profileImage) {
      throw new Error("[context_find] profileImage is undefined");
    }

    const file = new AttachmentBuilder(profileImage);

    const components = ProfileUtil.getComponents(
      "profile",
      null,
      "find",
      character.ID,
    );

    await interaction.editReply({
      content: `Latest Update: <t:${characterDataDto.latestUpdate.unix()}:R>`,
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
  const embed = DiscordUtil.getErrorEmbed(message);

  await interaction.editReply({
    content: " ",
    embeds: [embed],
  });
}
