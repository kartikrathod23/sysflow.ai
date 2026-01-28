import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request{
    user?:{
        id:string,
        email:string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({error : 'No token provided'});
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {userId:string, email:string};

        req.user={
            id: decoded.userId,
            email: decoded.email
        };
        next();
    }
    catch(err){
        return res.status(401).json({error: 'Invalid token'});
    }
}