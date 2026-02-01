import { redis } from './redisClient';

const SIMULATION_STREAM = 'simulation-jobs';

export async function enqueueSimulationJob(payload: {
  simulationRunId: string;
  graph: any;
  config: any;
}) {
  await redis.xadd(
    SIMULATION_STREAM,
    '*',
    'simulationRunId',
    payload.simulationRunId,
    'graph',
    JSON.stringify(payload.graph),
    'config',
    JSON.stringify(payload.config),
    'timestamp',
    Date.now().toString()
  );
}

