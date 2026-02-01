import {Router } from "express";
import { z } from "zod";
import * as workspaceController from "../controllers/workspaceController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

const router = Router();

const createWorkspaceSchema = z.object({
    name: z.string().min(1).max(255)
});

router.use(authenticate);

router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.get('/', workspaceController.getWorksSpaces);
router.get('/:id', workspaceController.getWorkSpace);
router.delete('/:id', workspaceController.deleteWorkSpace);

export default router;  

