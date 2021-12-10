const fs = require('fs')
const { Client, Collection, Intents, MessageAttachment } = require('discord.js')
const { token } = require('./config.json')
const { CanvasRenderingContext2D } = require('canvas')
const DiscordUtil = require('./naagoLib/DiscordUtil')
const DbUtil = require('./naagoLib/DbUtil')
const ProfileUtil = require('./naagoLib/profileUtil')
const ButtonUtil = require('./naagoLib/ButtonUtil')

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
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

client.commands = new Collection()
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.data.name, command)
}

// Discord events
client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`)
})

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName)

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(error)

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
  }
})

client.login(token)
