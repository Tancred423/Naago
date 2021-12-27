const { SlashCommandBuilder } = require('@discordjs/builders')
const HelpUtil = require('../naagoLib/HelpUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Command overview and explanations.'),
  async execute(interaction) {
    await interaction.reply(await HelpUtil.getProfiles(interaction))
  }
}
