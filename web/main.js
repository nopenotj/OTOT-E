const { createClient } = require('redis');
const { Sequelize,DataTypes } = require('sequelize');

const express = require('express')
const app = express()
const port = 3000
const cache_ttl = 30 // in seconds


const sequelize = new Sequelize(`postgres://postgres:asdf@${process.env.DB_HOST}:5432`)
const redis = createClient({url: `redis://${process.env.REDIS_HOST}:6379`});
redis.on('error', (err) => console.log('Redis Client Error', err));
redis.connect();
const User = sequelize.define('user', {
  // Model attributes are defined here
  id: { type: DataTypes.INTEGER, primaryKey: true },
  first_name: { type: DataTypes.STRING },
  last_name: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  ip_address: { type: DataTypes.STRING },
}, { 
    timestamps: false
});



app.get('/', async (_, res) => {
    const e = await redis.get('all');
    
    if (e != null) return res.send(JSON.parse(e))

    console.log("Uncached Call")
    let items = await User.findAll()
    items = items.map(i => i.toJSON());
    redis.set('all',JSON.stringify(items), {EX:cache_ttl})
    return res.send(items)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
