import {redis} from './redisClient';

const pub = redis.duplicate();
const sub = redis.duplicate();

export async function publishToRoom(designId : string, message: string){
    const channel = `design_${designId}`;
    await pub.publish(channel, message);
}

export function subscribeToRoom(designId : string, handler: (msg: string) => void){
    const channel = `design_${designId}`;
    sub.subscribe(channel, (err, count) => {
        if (err) {
            console.error('Failed to subscribe: ', err);
            return;
        }
        console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
    });

    sub.on('message', (ch, message) => {
        if (ch === channel) {
            handler(JSON.parse(message));
        }
    });
}