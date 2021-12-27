const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const { getBotColorByInteraction } = require('./DiscordUtil')
const { twitterUsername } = require('../config.json')
const NaagoUtil = require('./NaagoUtil')
const DiscordUtil = require('./DiscordUtil')

module.exports = class HelpUtil {
  static async getProfiles(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Character Profiles')
      .setThumbnail(client.user.displayAvatarURL())
      .addField(
        '/me',
        '● Get the profile of your verified character.\n● Characters can be verified with `/verify set`.'
      )
      .addField(
        '/find',
        "● Get any character's profile by providing the full character name and the server the character is on.\n● Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Find`. This is faster but requires this user to have a verified character."
      )
      .addField(
        '/favorite get',
        '● A quick access to character profiles.\n● Favorites can be added or removed with `/favorite add` and `/favorite remove` respectively.\n● Alternatively you can right click a user 🠆 choose `Apps` 🠆 `Add Favorite` / `Remove Favorite`. This is faster but requires this user to have a verified character.'
      )

    const component = HelpUtil.getButtons('profiles')

    return {
      embeds: [embed],
      components: [component]
    }
  }

  static async getNews(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Current News')
      .setThumbnail(client.user.displayAvatarURL())
      .addField(
        '/maintenance',
        '● Shows you the currently ongoing FFXIV maintenances. This is includes the game, the lodestone and companion app.'
      )
      .addField(
        '/fashionreport',
        `● Shows the current week's fashion report solutions kindly provided by [Kaiyoko](https://twitter.com/${twitterUsername}).`
      )

    const component = HelpUtil.getButtons('news')

    return {
      embeds: [embed],
      components: [component]
    }
  }

  static async getSetup(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Setup')
      .setThumbnail(client.user.displayAvatarURL())
      .addField(
        '/verify set',
        '● Links your FFXIV character to your Discord account.\n● You will have to verify it by changing the bio of your Lodestone profile.\n● Verification is needed to use `/theme`, `/favorite` and `/socialmedia`.'
      )
      .addField(
        '/verify delete',
        '● Unlinks your FFXIV character from your Discord account.\n● Also removes any other information stored of you including `/theme`, `/favorite` and `socialmedia`.'
      )
      .addField(
        '/theme',
        '● Set a custom theme for all character profiles you request.'
      )
      .addField(
        '/favorite add',
        '● Save any character as favorite.\n● You can then access them quickly with `/favorite get`.\n● You can have up to 25 favorites.'
      )
      .addField('/favorite remove', '● Remove one of your favorites.')
      .addField(
        '/socialmedia add',
        '● Save your social media links.\n● They will then be publicly displayed in the `Social Media` section of your profile.'
      )
      .addField(
        '/socialmedia remove',
        '● Remove one of your social media links.\n● It will then no longer be displayed on your profile.'
      )
      .addField(
        '/setup notifications',
        `● Set up automated notifications for Lodestone posts and weekly fashion report solutions kindly provided by [Kaiyoko](https://twitter.com/${twitterUsername}).\n● Lodestone posts include:\n   ○ Topics (Latest news and patch notes)\n   ○ Notices (Secondary news and letters from Naoki Yoshida)\n   ○ Maintenances (All kind of maintenances and their durations)\n   ○ Updates (Outcome from maintenances)\n   ○ Status (Technical difficulties and server statuses)`
      )
      .addField(
        '/setup purge',
        '● Removed all stored information of your server.\n● This includes all `/setup notifications` settings.'
      )

    const component = HelpUtil.getButtons('setup')

    return {
      embeds: [embed],
      components: [component]
    }
  }

  static async getTechnical(interaction) {
    const client = interaction.client

    const embed = new MessageEmbed()
      .setColor(await getBotColorByInteraction(interaction))
      .setTitle('Help: Technical')
      .setThumbnail(client.user.displayAvatarURL())
      .addField(
        '/ping',
        "● Displays the following technical information:\n   ○ Bot's latency to the websocket (ping)\n   ○ Bot's uptime\n   ○ Amount of servers the bot is currently on"
      )
      .addField(
        '/help',
        `● You are already here. ${(
          await DiscordUtil.getEmote(client, 'doggo_smile')
        ).toString()}`
      )

    const component = HelpUtil.getButtons('technical')

    return {
      embeds: [embed],
      components: [component]
    }
  }

  static getButtons(currentPage) {
    return new MessageActionRow().addComponents(
      new MessageButton()
        .setLabel('Character Profiles')
        .setCustomId('help-profiles')
        .setStyle(currentPage === 'profiles' ? 'PRIMARY' : 'SECONDARY'),
      new MessageButton()
        .setLabel('Current News')
        .setCustomId('help-news')
        .setStyle(currentPage === 'news' ? 'PRIMARY' : 'SECONDARY'),
      new MessageButton()
        .setLabel('Setup')
        .setCustomId('help-setup')
        .setStyle(currentPage === 'setup' ? 'PRIMARY' : 'SECONDARY'),
      new MessageButton()
        .setLabel('Technical')
        .setCustomId('help-technical')
        .setStyle(currentPage === 'technical' ? 'PRIMARY' : 'SECONDARY')
    )
  }
}
