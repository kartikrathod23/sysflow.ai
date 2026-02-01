import { Request,Response,NextFunction } from "express";
import { pool } from "@sysflow/shared";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

export const createWorkspace = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    const client = await pool.connect();
    try{
        const {name} = req.body;
        const userId = req.user?.id;

        await client.query('BEGIN');

        const workSpaceResult = await client.query(
            'INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING *',
            [name, userId]
        );

        const workspace = workSpaceResult.rows[0];

        await client.query(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
            [workspace.id, userId, 'OWNER']
        )

        await client.query('COMMIT');
        res.status(201).json({workspace});
    }
    catch(err){
        await client.query('ROLLBACK');
        next(err); 
    }
    finally{
        client.release();
    }
}

export const getWorksSpaces = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const userId = req.user?.id;

        const result = await pool.query(
            `SELECT w.*, wm.role FROM workspaces w INNER JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = $1 ORDER BY w.created_at DESC`,
            [userId]
        );
        res.json({workspaces: result.rows});
    }
    catch(err){
        next(err);
    }
};

export const getWorkSpace = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const userId = req.user?.id;
        const {id} = req.params;

        const accessCheckResult = await pool.query(
            `SELECT w.*, wm.role FROM workspaces w JOIN workspace_members wm ON w.id = wm.workspace_id WHERE wm.user_id = $1 AND w.id = $2`,
            [userId, id]
        );

        if(accessCheckResult.rows.length === 0){
            throw new AppError(403, 'Access denied to this workspace');
        }
        res.json({workspace: accessCheckResult.rows[0]});
    }
    catch(err){
        next(err);
    }
};

export const deleteWorkSpace = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const userId = req.user?.id;
        const {id} = req.params;

        const ownerCheckResult = await pool.query(
            `SELECT * FROM workspaces WHERE id = $1 AND owner_id = $2`,
            [id, userId]
        )

        if(ownerCheckResult.rows.length === 0){
            throw new AppError(403, 'Only the owner can delete this workspace');
        }

        await pool.query(
            `DELETE FROM workspaces WHERE id = $1`,
            [id]
        );
        
        res.json({message: 'Workspace deleted successfully'});
    }
    catch(err){
        next(err);
    }
};



