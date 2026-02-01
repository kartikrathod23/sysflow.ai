import { Router } from "express";
import * as simulationController from "../controllers/simulationController";
import { authenticate } from "../middleware/auth";
import { z } from "zod";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate);

const startSimulationSchema = z.object({
    systemDesignId: z.string().uuid(),
    config:z.object({
        durationSeconds: z.number().min(1).max(300),
        requestsPerSecond: z.number().min(1).max(10000),
        trafficPattern: z.enum(['CONSTANT', 'SPIKE', 'GRADUAL']),
    })
});

router.post('/start', validate(startSimulationSchema), simulationController.startSimulation);
router.get('/:id', simulationController.getSimulation);
router.get('/', simulationController.getSimulations);

export default router;
