const fs = require('fs')
const { Client, Collection, Intents } = require('discord.js')
const {
  guildId,
  token,
  twitterStreamEnabled,
  lodestoneCheckOnStart,
  checkCommandIds,
} = require('./config.json')
const { CanvasRenderingContext2D } = require('canvas')
const DiscordUtil = require('./naagoLib/DiscordUtil')
const ButtonUtil = require('./naagoLib/ButtonUtil')
const SelectMenuUtil = require('./naagoLib/SelectMenuUtil')
const TwitterUtil = require('./naagoLib/TwitterUtil')
const GlobalUtil = require('./naagoLib/GlobalUtil')
const moment = require('moment')
const cron = require('node-cron')
const TopicsUtil = require('./naagoLib/TopicsUtil')
const NoticesUtil = require('./naagoLib/NoticesUtil')
const MaintenancesUtil = require('./naagoLib/MaintenancesUtil')
const UpdatesUtil = require('./naagoLib/UpdatesUtil')
const StatusUtil = require('./naagoLib/StatusUtil')

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
  client.user.setActivity('naago.tancred.de', { type: 'PLAYING' })

  GlobalUtil.client = client

  // Twitter Bot
  try {
    if (twitterStreamEnabled) TwitterUtil.streamTweets()
  } catch (err) {
    console.error(err)
  }

  // Lodestone checker
  try {
    if (lodestoneCheckOnStart) {
      checkLodestone()
    } else {
      cron.schedule('1-59/15 * * * *', () => {
        checkLodestone()
        client.user.setActivity('naago.tancred.de', { type: 'PLAYING' })
      })
    }
  } catch (err) {
    console.error(err)
  }

  // Update owner command permissions
  updateOwnerCommands(client)
})

async function checkLodestone() {
  const topics = await TopicsUtil.updateDb()
  const notices = await NoticesUtil.updateDb()
  const maintenances = await MaintenancesUtil.updateDb()
  const updates = await UpdatesUtil.updateDb()
  const status = await StatusUtil.updateDb()

  console.log(
    `[${moment().format(
      'YYYY-MM-DD HH:mm',
    )}] Sent ${topics} topics, ${notices} notices, ${maintenances} maintenances, ${updates} updates and ${status} status.`,
  )
}

async function updateOwnerCommands(client) {
  const guild = await client.guilds.fetch(guildId)

  if (checkCommandIds) {
    const commands = await guild?.commands.fetch()
    commands.forEach((command) => {
      console.log(`${command.name}: ${command.id}`)
    })
  } else {
    // const resendFr = await guild?.commands.fetch(resendFrId)
    // const shutdown = await guild?.commands.fetch(shutdownId)
    // const permissions = [
    //   {
    //     id: '181896377486278657',
    //     type: 'USER',
    //     permission: true
    //   }
    // ]
    // await resendFr?.permissions.set({ permissions })
    // await shutdown?.permissions.set({ permissions })
  }
}

const cooldown = new Set()

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName)

    try {
      // hacky solution. todo: database cache with timestamp and then error output shows time remaining
      if (command.data.name === 'clearcache') {
        if (cooldown.has(interaction.user.id)) {
          const embed = DiscordUtil.getErrorEmbed(
            `Please wait before using the command again.`,
          )
          if (interaction.ephemeral) {
            await interaction.reply({
              ephemeral: true,
              embeds: [embed],
            })
          } else {
            await interaction.reply({
              ephemeral: true,
              embeds: [embed],
            })
          }
          return
        }

        cooldown.add(interaction.user.id)
        setTimeout(() => {
          cooldown.delete(interaction.user.id)
        }, 15 * 60 * 1000)
      }

      await command.execute(interaction)
    } catch (err) {
      console.error(err)

      const embed = DiscordUtil.getErrorEmbed(
        'There was an error while executing this command.',
      )
      if (interaction.ephemeral) {
        await interaction.editReply({
          embeds: [embed],
        })
      } else {
        await interaction.deleteReply()
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        })
      }
    }
  } else if (interaction.isButton()) {
    try {
      await ButtonUtil.execute(interaction)
    } catch (err) {
      console.error(err)
      const embed = DiscordUtil.getErrorEmbed(
        'There was an error while executing this button.',
      )
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      })
    }
  } else if (interaction.isSelectMenu()) {
    try {
      await SelectMenuUtil.execute(interaction)
    } catch (err) {
      console.error(err)
      const embed = DiscordUtil.getErrorEmbed(
        'There was an error while executing this menu.',
      )
      await interaction.followUp({
        embeds: [embed],
        ephemeral: true,
      })
    }
  } else if (interaction.isContextMenu()) {
    const command = client.commands.get(interaction.commandName)

    try {
      await command.execute(interaction)
    } catch (err) {
      console.error(err)
      const embed = DiscordUtil.getErrorEmbed(
        'There was an error while executing this command.',
      )
      if (interaction.ephemeral) {
        await interaction.editReply({
          embeds: [embed],
        })
      } else {
        await interaction.deleteReply()
        await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        })
      }
    }
  }
})

client.login(token)
