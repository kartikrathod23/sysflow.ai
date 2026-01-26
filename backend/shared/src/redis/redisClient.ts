import Redis from 'ioredis';

export const redis = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    lazyConnect: true,
    maxRetriesPerRequest: null,
})

redis.on('connect', ()=>{
    console.log('Connected to Redis server');
})

redis.on('error', (err: any)=>{
    console.error('Redis error: ', err);
});