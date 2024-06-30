const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const { getBotColorByInteraction } = require('./DiscordUtil')
const { twitterUsername } = require('../config.json')
const DiscordUtil = require('./DiscordUtil')

module.exports = class HelpUtil {
  static async update(interaction, buttonIdSplit) {
    const page = buttonIdSplit[1]
    switch (page) {
      case 'profiles':
        await interaction.editReply(await this.getProfiles(interaction))
        break
      case 'news':
        await interaction.editReply(await this.getNews(interaction))
        break
      case 'setup':
        await interaction.editReply(await this.getSetup(interaction))
        break
      case 'technical':
        await interaction.editReply(await this.getTechnical(interaction))
        break
      default:
        throw new Error(`Help button with ID '${page}' doesn't exist.`)
    }
  }

  static async getProfiles(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Character Profiles')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields([
        {
          name: '/me',
          value:
            '- Get the profile of your verified character.\n- Characters can be verified with `/verify set`.',
          inline: false,
        },
        {
          name: '/find',
          value:
            "- Get any character's profile by providing the full character name and the server the character is on.\n- Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Find`. This is faster but requires this user to have a verified character.",
          inline: false,
        },
        {
          name: '/favorite get',
          value:
            '- A quick access to character profiles.\n- Favorites can be added or removed with `/favorite add` and `/favorite remove` respectively.\n- Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Add Favorite` / `Remove Favorite`. This is faster but requires this user to have a verified character.',
          inline: false,
        },
      ])

    const component = HelpUtil.getButtons('profiles')

    return {
      embeds: [embed],
      components: [component],
    }
  }

  static async getNews(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Current News')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields([
        {
          name: '/maintenance',
          value:
            '- Shows you the currently ongoing FFXIV maintenances. This includes the game, the lodestone, and companion app.',
          inline: false,
        },
        {
          name: '/fashionreport',
          value: `- Shows the current week's fashion report solutions kindly provided by [Kaiyoko](https://twitter.com/${twitterUsername}).`,
          inline: false,
        },
      ])

    const component = HelpUtil.getButtons('news')

    return {
      embeds: [embed],
      components: [component],
    }
  }

  static async getSetup(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Setup')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields([
        {
          name: '/verify set',
          value:
            '- Links your FFXIV character to your Discord account.\n- You will have to verify it by changing the bio of your Lodestone profile.\n- Verification is needed to use `/theme` and `/favorite`.',
          inline: false,
        },
        {
          name: '/verify delete',
          value:
            '- Unlinks your FFXIV character from your Discord account.\n- Also removes any other information stored of you including `/theme` and `/favorite`.',
          inline: false,
        },
        {
          name: '/theme',
          value: '- Set a custom theme for all character profiles you request.',
          inline: false,
        },
        {
          name: '/favorite add',
          value:
            '- Save any character as favorite.\n- You can then access them quickly with `/favorite get`.\n- You can have up to 25 favorites.',
          inline: false,
        },
        {
          name: '/favorite remove',
          value: '- Remove one of your favorites.',
          inline: false,
        },
        {
          name: '/setup notifications',
          value: `- Set up automated notifications for Lodestone posts and weekly fashion report solutions kindly provided by [Kaiyoko](https://twitter.com/${twitterUsername}).\n- Lodestone posts include:\n  - Topics (Latest news and patch notes)\n  - Notices (Secondary news and letters from Naoki Yoshida)\n  - Maintenances (All kind of maintenances and their durations)\n  - Updates (Outcome from maintenances)\n  - Status (Technical difficulties and server statuses)`,
          inline: false,
        },
        {
          name: '/setup purge',
          value:
            '- Removed all stored information of your server.\n- This includes all `/setup notifications` settings.',
          inline: false,
        },
      ])

    const component = HelpUtil.getButtons('setup')

    return {
      embeds: [embed],
      components: [component],
    }
  }

  static async getTechnical(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Technical')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields([
        {
          name: '/ping',
          value:
            "- Displays the following technical information:\n  - Bot's latency to the websocket (ping)\n  - Bot's uptime\n  - Amount of servers the bot is currently on",
          inline: false,
        },
        {
          name: '/help',
          value: `- You are already here. ${(
            await DiscordUtil.getEmote(client, 'doggo_smile')
          ).toString()}`,
          inline: false,
        },
      ])

    const component = HelpUtil.getButtons('technical')

    return {
      embeds: [embed],
      components: [component],
    }
  }

  static getButtons(currentPage) {
    return new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('Character Profiles')
        .setCustomId('help.profiles')
        .setStyle(currentPage === 'profiles' ? 'PRIMARY' : 'SECONDARY'),
      new MessageButton()
        .setLabel('Current News')
        .setCustomId('help.news')
        .setStyle(currentPage === 'news' ? 'PRIMARY' : 'SECONDARY'),
      new MessageButton()
        .setLabel('Setup')
        .setCustomId('help.setup')
        .setStyle(currentPage === 'setup' ? 'PRIMARY' : 'SECONDARY'),
      new MessageButton()
        .setLabel('Technical')
        .setCustomId('help.technical')
        .setStyle(currentPage === 'technical' ? 'PRIMARY' : 'SECONDARY'),
    )
  }
}
