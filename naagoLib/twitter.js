const { TwitterApi } = require('twitter-api-v2')

const { twitterBearerToken } = require('../config.json')

const T = new TwitterApi(twitterBearerToken)

module.exports = T
