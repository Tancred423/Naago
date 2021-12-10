const axios = require('axios')
const crypto = require('crypto')
const NaagoUtil = require('./naagoUtil')
const fs = require('fs')

module.exports = class FfxivUtil {
  static formatName(name) {
    const nameSplit = name.split(' ')
    if (nameSplit.length !== 2) return name

    const firstName = nameSplit[0]
    const lastName = nameSplit[1]

    return `${firstName.substring(0, 1).toUpperCase()}${firstName
      .substring(1)
      .toLowerCase()} ${lastName.substring(0, 1).toUpperCase()}${lastName
      .substring(1)
      .toLowerCase()}`
  }

  static isValidServer(server) {
    const data = fs.readFileSync('servers.txt')
    const servers = data.toString().split(',')
    return servers.includes(server.toLowerCase())
  }

  static async getCharacterIdsByName(name, server) {
    const nameEncoded = encodeURIComponent(name)
    const res = await axios.get(
      `http://localhost:8080/character/search?name=${nameEncoded}&worldname=${server}`
    )

    if (res.status !== 200) return []
    else return res.data.List.map((a) => a.ID)
  }

  static async getCharacterById(id) {
    const res = await axios.get(`http://localhost:8080/character/${id}`)
    if (res.status !== 200) return undefined
    else {
      const char = res.data.Character
      const iLvls = []

      if (char.mainhand?.item_level) iLvls.push(char.mainhand.item_level)
      if (char.offhand?.item_level) iLvls.push(char.offhand.item_level)
      if (char.head?.item_level) iLvls.push(char.head.item_level)
      if (char.body?.item_level) iLvls.push(char.body.item_level)
      if (char.hands?.item_level) iLvls.push(char.hands.item_level)
      if (char.legs?.item_level) iLvls.push(char.legs.item_level)
      if (char.feet?.item_level) iLvls.push(char.feet.item_level)
      if (char.earrings?.item_level) iLvls.push(char.earrings.item_level)
      if (char.necklace?.item_level) iLvls.push(char.necklace.item_level)
      if (char.bracelets?.item_level) iLvls.push(char.bracelets.item_level)
      if (char.ring1?.item_level) iLvls.push(char.ring1.item_level)
      if (char.ring2?.item_level) iLvls.push(char.ring2.item_level)

      let avgIlvl = 0
      for (const iLvl of iLvls) avgIlvl += parseInt(iLvl.split(' ')[2])
      res.data.Character.average_ilvl = NaagoUtil.addLeadingZeros(
        Math.ceil(avgIlvl / iLvls.length)
      )

      return res.data.Character
    }
  }

  static generateVerificationCode() {
    return `naago-${crypto.randomBytes(3).toString('hex')}`
  }
}
