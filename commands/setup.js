const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageActionRow, MessageButton, Permissions } = require('discord.js')
const DbUtil = require('../naagoLib/DbUtil')
const DiscordUtil = require('../naagoLib/DiscordUtil')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription("Setup M'naago.")
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('fashionreport')
        .setDescription('Set up automated fashion report details.')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription(
              'Set a channel for automated fashion report details.'
            )
            .addChannelOption((option) =>
              option
                .setName('channel')
                .setDescription('The channel for fashion report details.')
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('unset')
            .setDescription('Unset the channel for fashion report details.')
        )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('maintenance')
        .setDescription('Set up automated maintenance details.')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Set a channel for automated maintenance details.')
            .addChannelOption((option) =>
              option
                .setName('channel')
                .setDescription('The channel for maintenance details.')
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('unset')
            .setDescription('Unset the channel for maintenance details.')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('purge')
        .setDescription('Delete all saved data of this server.')
    ),
  async execute(interaction) {
    if (
      !(await DiscordUtil.hasAllPermissions(
        interaction,
        interaction.member,
        Permissions.FLAGS.MANAGE_CHANNELS,
        Permissions.FLAGS.MANAGE_GUILD
      ))
    )
      return

    await interaction.deferReply({ ephemeral: true })

    const guildId = interaction.guild.id

    if (interaction.options.getSubcommandGroup(false) === 'fashionreport') {
      if (interaction.options.getSubcommand() === 'set') {
        const channel = interaction.options.getChannel('channel')

        const successful = await DbUtil.setFashionReportChannelId(
          guildId,
          channel.id
        )

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            `Fashion report channel could not be set to ${channel.toString()}. Please contact Tancred#0001 for help.`
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          `Automated fashion report updates will now be in ${channel.toString()}.`
        )

        await interaction.editReply({
          embeds: [embed]
        })
      } else {
        const currentchannel = await DbUtil.getFashionReportChannelId(guildId)

        if (!currentchannel) {
          const embed = DiscordUtil.getSuccessEmbed(
            "You didn't set a channel yet."
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const successful = await DbUtil.unsetFashionReportChannelId(guildId)

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            'The channel could not be unset. Please contact Tancred#0001 for help.'
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          'Fashion report channel successfully unset.'
        )

        await interaction.editReply({
          embeds: [embed]
        })
      }
    } else if (
      interaction.options.getSubcommandGroup(false) === 'maintenance'
    ) {
      if (interaction.options.getSubcommand() === 'set') {
        const channel = interaction.options.getChannel('channel')

        const successful = await DbUtil.setMaintenanceChannelId(
          guildId,
          channel.id
        )

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            `Maintenance channel could not be set to ${channel.toString()}. Please contact Tancred#0001 for help.`
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          `Automated maintenance updates will now be in ${channel.toString()}.`
        )

        await interaction.editReply({
          embeds: [embed]
        })
      } else {
        const currentchannel = await DbUtil.getMaintenanceChannelId(guildId)

        if (!currentchannel) {
          const embed = DiscordUtil.getSuccessEmbed(
            "You didn't set a channel yet."
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const successful = await DbUtil.unsetMaintenanceChannelId(guildId)

        if (!successful) {
          const embed = DiscordUtil.getErrorEmbed(
            'The channel could not be unset. Please contact Tancred#0001 for help.'
          )

          await interaction.editReply({
            embeds: [embed]
          })

          return
        }

        const embed = DiscordUtil.getSuccessEmbed(
          'Maintenance channel successfully unset.'
        )

        await interaction.editReply({
          embeds: [embed]
        })
      }
    } else {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('unsetup.cancel')
          .setLabel('No, cancel.')
          .setStyle('SECONDARY'),
        new MessageButton()
          .setCustomId(`unsetup.agree}`)
          .setLabel('Yes, delete it.')
          .setStyle('DANGER')
      )

      await interaction.editReply({
        content:
          'Are you sure you want to delete all stored data of this guild?',
        components: [row]
      })
    }
  },

  unsetup: async (interaction) => {
    const idSplit = interaction.component.customId.split('.')
    if (idSplit.length !== 2) {
      await interaction.editReply({
        embeds: [
          DiscordUtil.getErrorEmbed(
            `Could not fetch your answer. Please try again later.`
          )
        ],
        ephemeral: true
      })
      return
    }

    const action = idSplit[1]

    if (action === 'cancel') {
      const embed = DiscordUtil.getSuccessEmbed('Cancelled.')
      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: []
      })
      return
    }

    const successful = DbUtil.purgeGuild(interaction.guild.id)

    if (successful) {
      const embed = DiscordUtil.getSuccessEmbed(
        'All data from this guild has been deleted.'
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: []
      })
    } else {
      const embed = DiscordUtil.getErrorEmbed(
        "This guild's data could not be (fully) deleted. Please contact Tancred#0001 for help."
      )

      await interaction.editReply({
        content: ' ',
        embeds: [embed],
        components: []
      })
    }
  }
}
