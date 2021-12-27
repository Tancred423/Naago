const axios = require('axios')
const crypto = require('crypto')
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
      `http://localhost:8081/character/search?name=${nameEncoded}&worldname=${server}`
    )
    if (res.status !== 200) return []
    else return res.data.List.map((a) => a.ID)
  }

  static async getCharacterById(id) {
    const res = await axios.get(`http://localhost:8081/character/${id}`)
    if (res.status !== 200) return undefined
    else return res?.data?.Character
  }

  static generateVerificationCode() {
    return `naago-${crypto.randomBytes(3).toString('hex')}`
  }
}
