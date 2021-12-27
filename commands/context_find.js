const { ContextMenuCommandBuilder } = require('@discordjs/builders')
const { ApplicationCommandType } = require('discord-api-types/v9')
const { MessageAttachment } = require('discord.js')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const ProfileUtil = require('../naagoLib/ProfileUtil')

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Find')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const target = interaction.options.getMember('user')
    const isVerified = target.id === interaction.user.id

    const characterCache = await DbUtil.getCharacter(target.id)

    if (!characterCache) {
      const embed = DiscordUtil.getErrorEmbed(
        'This user does not have a verified character.'
      )

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      })

      return
    }

    await interaction.deferReply()

    const character = await DbUtil.fetchCharacter(
      interaction,
      characterCache.ID
    )

    const profileImage = await ProfileUtil.getImage(
      interaction,
      character,
      isVerified,
      'profile'
    )

    if (!profileImage)
      throw new Error('[context_find] profileImage is undefined')

    const file = new MessageAttachment(profileImage)

    const components = ProfileUtil.getComponents(
      'profile',
      null,
      'find',
      character.ID
    )

    await interaction.editReply({
      content: ' ',
      files: [file],
      embeds: [],
      attachments: [],
      components: components
    })
  }
}
