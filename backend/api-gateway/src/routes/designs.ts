import { Router } from "express";
import { z } from "zod"; 
import * as designController from "../controllers/designController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

const createDesignSchema = z.object({
    workspaceId: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional()
});

const updateDesignSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    graph_json: z.object({
        nodes: z.array(z.any()),
        edges: z.array(z.any()),
    }).optional(),
});

router.post('/', validate(createDesignSchema), designController.createDesign);
router.get('/', designController.getDesigns);
router.get('/:id', designController.getDesign);
router.put('/:id', validate(updateDesignSchema), designController.updateDesign);
router.delete('/:id', designController.deleteDesign);

export default router;