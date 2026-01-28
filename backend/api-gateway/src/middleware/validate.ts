import { Request, Response, NextFunction } from "express";
import { Schema, ZodSchema } from "zod";

export const validate = (schema : ZodSchema) =>{
    return (req:Request, res:Response, next:NextFunction) => {
        try{
            schema.parse(req.body);
            next();
        }
        catch(err: any){
            return res.status(400).json({error: 'Invalid request data', details: err.errors});
        }
    };
};