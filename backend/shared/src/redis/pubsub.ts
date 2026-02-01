import {redis} from './redisClient';

const pub = redis.duplicate();
const sub = redis.duplicate();

export async function publishToRoom(designId : string, message: string){
    const channel = `design_${designId}`;
    await pub.publish(channel, message);
}

export function subscribeToAllDesignEvents(handler: (channel: string, message: any) => void){
    // const channel = `design_${designId}`;
    sub.psubscribe("design_*", (err, count) => {
        if (err) {
            console.error('Failed to subscribe: ', err);
            return;
        }
        console.log(`Subscribed successfully! This client is currently subscribed to ${count} channels.`);
    });

    sub.on('pmessage', (_,channel, message) => {
        handler(channel,JSON.parse(message));
    });
}