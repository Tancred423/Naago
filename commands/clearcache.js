const { SlashCommandBuilder } = require('@discordjs/builders')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')
const { cooldown } = require('../naagoLib/ButtonUtil')

module.exports = {
    cooldown: 15 * 60 * 1000,
    data: new SlashCommandBuilder()
        .setName('clearcache')
        .setDescription('Clears the cache of your lodestone information.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true })
        const isSuccess = await DbUtil.clearCache(interaction.user.id)

        if (!isSuccess) {
            await interaction.editReply({
                embeds: [
                    DiscordUtil.getErrorEmbed('Failed to clear cache. Please try again later.')
                ],
            })
            return
        }

        await interaction.editReply({
            embeds: [
                DiscordUtil.getSuccessEmbed('Cache cleared.')
            ],
        })
    },
}
