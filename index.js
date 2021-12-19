const fs = require('fs')
const { Client, Collection, Intents } = require('discord.js')
const {
  token,
  twitterStreamEnabled,
  maintenanceStartInstantly
} = require('./config.json')
const { CanvasRenderingContext2D } = require('canvas')
const DiscordUtil = require('./naagoLib/DiscordUtil')
const ButtonUtil = require('./naagoLib/ButtonUtil')
const SelectMenuUtil = require('./naagoLib/SelectMenuUtil')
const TwitterUtil = require('./naagoLib/TwitterUtil')
const GlobalUtil = require('./naagoLib/GlobalUtil')
const MaintenanceUtil = require('./naagoLib/MaintenanceUtil')
const moment = require('moment')
const cron = require('node-cron')

// Locale
moment.locale('en')

// Canvas lib
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  this.beginPath()
  this.moveTo(x + r, y)
  this.arcTo(x + w, y, x + w, y + h, r)
  this.arcTo(x + w, y + h, x, y + h, r)
  this.arcTo(x, y + h, x, y, r)
  this.arcTo(x, y, x + w, y, r)
  this.closePath()
  return this
}

// Discord bot setup
const client = new Client({ intents: [Intents.FLAGS.GUILDS] }) // , shards: 'auto'

client.commands = new Collection()
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.data.name, command)
}

const ownerCommandFiles = fs
  .readdirSync('./commands/owner')
  .filter((file) => file.endsWith('.js'))

for (const ownerfile of ownerCommandFiles) {
  const ownerCommand = require(`./commands/owner/${ownerfile}`)
  client.commands.set(ownerCommand.data.name, ownerCommand)
}

// Discord events
client.once('ready', () => {
  console.log(`Connected: Discord (${client.user.tag})`)
  client.user.setActivity('Endwalker', { type: 'PLAYING' })

  GlobalUtil.client = client

  // Twitter Bot
  try {
    if (twitterStreamEnabled) TwitterUtil.streamTweets()
  } catch (err) {
    console.error(err)
  }

  // Maintenance checker
  try {
    if (maintenanceStartInstantly) MaintenanceUtil.updateDb()
    else {
      cron.schedule('*/15 * * * *', () => {
        MaintenanceUtil.updateDb()
      })
    }
  } catch (err) {
    console.error(err)
  }
})

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName)

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(error)

      if (interaction.ephemeral) {
        await interaction.editReply({
          embeds: [
            DiscordUtil.getErrorEmbed(
              'There was an error while executing this command.'
            )
          ]
        })
      } else {
        await interaction.deleteReply()
        await interaction.followUp({
          embeds: [
            DiscordUtil.getErrorEmbed(
              'There was an error while executing this command.'
            )
          ],
          ephemeral: true
        })
      }
    }
  } else if (interaction.isButton()) {
    try {
      ButtonUtil.execute(interaction)
    } catch (error) {
      console.error(error)
      const embed = DiscordUtil.getErrorEmbed(
        'There was an error while executing this command.'
      )
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true
      })
    }
  } else if (interaction.isSelectMenu()) {
    try {
      SelectMenuUtil.execute(interaction)
    } catch (error) {
      console.error(error)
      const embed = DiscordUtil.getErrorEmbed(
        'There was an error while executing this command.'
      )
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true
      })
    }
  }
})

client.login(token)
