import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, {SignOptions} from "jsonwebtoken";
import {pool} from "@sysflow/shared";
import { AppError } from "../middleware/errorHandler";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']
};

export const register = async(req:Request, res:Response, next:NextFunction) =>{
    try{
        const {email,password,name} = req.body;

        const existingUser = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if(existingUser.rows.length > 0){
            throw new AppError(400, 'User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hashedPassword, name]
        );

        const user = result.rows[0];
        
        const token = jwt.sign(
            {userId: user.id, email: user.email},
            JWT_SECRET,
            signOptions
        );

        res.status(201).json({user: {id: user.id, email: user.email, name: user.name}, token});
    }
    catch(err){
        next(err);
    }
}


export const login = async(req:Request, res:Response, next:NextFunction) =>{
    try{
        const {email, password} = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if(result.rows.length === 0){
            throw new AppError(400, 'Invalid email or password');
        } 
        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if(!isPasswordValid){
            throw new AppError(400, 'Invalid email or password');
        }   

        const token = jwt.sign(
            {userId: user.id, email: user.email},
            JWT_SECRET,
            signOptions
        );
        res.status(200).json({user: {id: user.id, email: user.email, name: user.name}, token});
    }
    catch(err){
        next(err);
    }
}


export const getProfile = async(req:Request, res:Response, next:NextFunction) =>{
    try{
        const userId = (req as any).user.id;

        const result = await pool.query('SELECT id, email, name FROM users WHERE id=$1', [userId]);
        if(result.rows.length === 0){
            throw new AppError(404, 'User not found');
        }
        const user = result.rows[0];
        res.status(200).json({user});
    }
    catch(err){
        next(err);
    }
}