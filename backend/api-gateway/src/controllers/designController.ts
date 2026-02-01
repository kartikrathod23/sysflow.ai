import { Response, Request, NextFunction } from "express";
import { pool , publishToRoom} from "@sysflow/shared";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

export const createDesign = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const {workspaceId, name, description} = req.body;
        const userId = req.user?.id;

        const accessCheckResult = await pool.query(
            `SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
            [workspaceId, userId]
        )

        if(accessCheckResult.rows.length === 0){
            throw new AppError(403, 'You do not have access to this workspace');
        }

        if(accessCheckResult.rows[0].role !== 'owner' && accessCheckResult.rows[0].role !== 'editor'){
            throw new AppError(403, 'You do not have permission to create designs in this workspace');
        }

        const result = await pool.query(
            `INSERT INTO system_designs (workspace_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *, workspace_id, name, description, created_at`,
            [workspaceId, name, description, userId]
        )
        res.status(201).json({
            success: true,
            data: result.rows[0]
        })
    } catch(error){
        next(error);
    }
};

export const getDesigns = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const userId = req.user?.id;
        const {workspaceId} = req.params;

        const accessCheckResult = await pool.query(
            `SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
            [workspaceId, userId]
        );

        if(accessCheckResult.rows.length === 0){
            throw new AppError(403, 'You do not have access to this workspace');
        }

        const result = await pool.query(
            `SELECT sd.*, u.name as creator_name FROM system_designs sd JOIN users u ON sd.created_by = u.id WHERE sd.workspace_id = $1 ORDER BY sd.updated_at DESC`,
        )
    } catch(error){
        next(error);
    }
};

export const getDesign = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const userId = req.user?.id;
        const {id} = req.params;

        const result = await pool.query(
            `SELECT sd.* FROM system_designs sd INNER JOIN workspace_members wm ON sd.workspace_id = wm.workspace_id WHERE sd.id = $1 AND wm.user_id = $2`,
            [id, userId]
        );
        if(result.rows.length === 0){
            throw new AppError(404, 'Design not found or access denied');
        }
        res.status(200).json({
            success: true,
            data: result.rows[0]
        })
    } catch(error){
        next(error);
    }
}


export const updateDesign = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const {id} = req.params;
        const {name, description, graph_json} = req.body;
        const userId = req.user?.id;

        const accessCheckResult = await pool.query(
            `SELECT wm.role FROM system_designs sd INNER JOIN workspace_members wm ON sd.workspace_id = wm.workspace_id WHERE sd.id = $1 AND wm.user_id = $2`,
            [id, userId]
        )

        if(accessCheckResult.rows.length === 0){
            throw new AppError(403, 'You do not have access to this design');
        }

        if(accessCheckResult.rows[0].role !== 'owner' && accessCheckResult.rows[0].role !== 'editor'){
            throw new AppError(403, 'You do not have permission to update this design');
        }

        const updates :string[] = [];
        const values :any[] = [];
        let paramCount = 1;

        if(name !== undefined){
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }

        if(description !== undefined){
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }

        if(graph_json !== undefined){
            updates.push(`graph_json = $${paramCount++}`);
            values.push(graph_json);
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await pool.query(
            `UPDATE system_designs SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        // publis updated to redis

        await publishToRoom(
            id,
            JSON.stringify({
                type: 'DESIGN_SAVED',
                payload: result.rows[0],
                userId,
                timestamp: new Date().toISOString()
            })
        );

        res.status(200).json({
            success: true,
            design: result.rows[0]
        })
    }
    catch(error){
        next(error);
    }
};

export const deleteDesign = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is workspace owner or design creator
    const permCheck = await pool.query(
      `SELECT w.owner_id, sd.created_by
       FROM system_designs sd
       INNER JOIN workspaces w ON sd.workspace_id = w.id
       WHERE sd.id = $1`,
      [id]
    );

    if (permCheck.rows.length === 0) {
      throw new AppError(404, 'Design not found');
    }

    const { owner_id, created_by } = permCheck.rows[0];

    if (owner_id !== userId && created_by !== userId) {
      throw new AppError(403, 'Only workspace owner or design creator can delete');
    }

    await pool.query('DELETE FROM system_designs WHERE id = $1', [id]);

    res.json({ message: 'Design deleted' });
  } catch (error) {
    next(error);
  }
};