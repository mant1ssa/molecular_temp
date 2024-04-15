
const redisModule = require("redis");

 
const redis = redisModule.createClient();

redis.on("error", e => console.log(e.message));
redis.on("ready", () => console.log("connected to redis"));

redis.connect();

module.exports = redis;