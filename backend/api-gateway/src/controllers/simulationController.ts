import { Response, Request, NextFunction } from "express";
import {pool, enqueueSimulationJob} from '@sysflow/shared';
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

export const startSimulation = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const {systemDesignId, config} = req.body;
        const userId = req.user?.id;

        const designCheckResult = await pool.query(
            `SELECT sd.graph_data FROM system_designs sd INNER JOIN workspace_members wm ON sd.workspace_id = wm.workspace_id WHERE sd.id = $1 AND wm.user_id = $2`,
            [systemDesignId, userId]
        );

        if(designCheckResult.rows.length === 0){
            throw new AppError(403, 'You do not have access to this system design');
        }

        const graph = designCheckResult.rows[0].graph_json;

        if(!graph.nodes || graph.nodes.length === 0){
            throw new AppError(400, 'System design graph is empty');
        }

        const result = await pool.query(
            `INSERT INTO simulation_runs (system_design_id, status, config_json, created_by) VALUES ($1, $2, $3, $4) RETURNING *`,
            [systemDesignId, 'QUEUED', JSON.stringify(config), userId]
        )

        const simulation = result.rows[0];

        // Publish to Redis for worker to pick up
        await enqueueSimulationJob({
            simulationRunId: simulation.id,
            graph,
            config
        });
        res.status(201).json({ simulation});
    }
    catch(err){
        next(err);
    }
};

export const getSimulation = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const {id} = req.params;
        const userId = req.user?.id;

        const result = await pool.query(
            `SELECT sr.* FROM simulation_runs sr
            INNER JOIN system_designs sd ON sr.system_design_id = sd.id
            INNER JOIN workspace_members wm ON sd.workspace_id = wm.workspace_id
            WHERE sr.id = $1 AND wm.user_id = $2`,
            [id, userId]
        );

        if(result.rows.length === 0){
            throw new AppError(404, 'Simulation not found');
        }

        res.status(200).json({simulation: result.rows[0]});
    }
    catch(err){
        next(err);
    }
}

export const getSimulations = async(req:AuthRequest, res:Response, next:NextFunction) =>{
    try{
        const userId = req.user?.id;
        const {systemDesignId} = req.query;

        const result = await pool.query(
            `SELECT sr.* FROM simulation_runs sr
            INNER JOIN system_designs sd ON sr.system_design_id = sd.id
            INNER JOIN workspace_members wm ON sd.workspace_id = wm.workspace_id
            WHERE sr.system_design_id = COALESCE($1, sr.system_design_id) AND wm.user_id = $2`,
            [systemDesignId || null, userId]
        )
        res.status(200).json({simulations: result.rows});
    }
    catch(err){
        next(err);
    }
}