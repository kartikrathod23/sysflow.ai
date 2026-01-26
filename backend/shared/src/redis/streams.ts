import { redis } from './redisClient';

const STREAM_KEY = 'simulation-events';

export async function addSimulationEvent(event: {
  simulationRunId: string;
  type: string;
  service: string;
  latencyMs?: number;
  error?: boolean;
}) {
  await redis.xadd(
    STREAM_KEY,
    '*',
    'simulationRunId',
    event.simulationRunId,
    'type',
    event.type,
    'service',
    event.service,
    'latencyMs',
    String(event.latencyMs || 0),
    'error',
    String(event.error || false),
    'timestamp',
    Date.now().toString()
  );
}
