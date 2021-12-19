const fs = require('fs')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const { clientId, guildId, token } = require('./config.json')

// Global commands
const commands = []
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  commands.push(command.data.toJSON())
}

// Owner commands
const ownerCommands = []
const ownerCommandFiles = fs
  .readdirSync('./commands/owner')
  .filter((file) => file.endsWith('.js'))

for (const ownerFile of ownerCommandFiles) {
  const ownerCommand = require(`./commands/owner/${ownerFile}`)
  commands.push(ownerCommand.data.toJSON())
}

// Register commands
const rest = new REST({ version: '9' }).setToken(token)

rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  .then(() =>
    console.log('Successfully registered global application commands.')
  )
  .catch(console.error)

// rest
//   .put(Routes.applicationGuildCommands(clientId, guildId), {
//     body: ownerCommands
//   })
//   .then(() =>
//     console.log('Successfully registered owner application commands.')
//   )
//   .catch(console.error)
