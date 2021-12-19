const { SlashCommandBuilder } = require('@discordjs/builders')
const DiscordUtil = require('../../naagoLib/DiscordUtil')
const GlobalUtil = require('../../naagoLib/GlobalUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shutdown')
    .setDescription('Shutdown the bot safely.')
    .setDefaultPermission(false),
  permissions: [
    {
      id: '181896377486278657',
      type: 'USER',
      permission: true
    }
  ],
  async execute(interaction) {
    GlobalUtil.closeStream()

    await interaction.reply({
      embeds: [DiscordUtil.getSuccessEmbed('Bot will be shutdown.')],
      ephemeral: true
    })

    await interaction.client.destroy()

    process.exit(1)
  }
}
