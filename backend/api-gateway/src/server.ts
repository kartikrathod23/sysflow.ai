import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';

// import rateLimit from 'express-rate-limit';
import { isRateLimited } from '@sysflow/shared';

import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workSpaces';
import simulationRoutes from './routes/simulations';
import designRoutes from './routes/designs';
import { errorHandler } from './middleware/errorHandler';
import { AuthRequest } from './middleware/auth';
import { initializeSocketServer } from './websocket/socketServer';

const app= express();
const httpServer = http.createServer(app);

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());

// rate limiting
app.use(async(req:AuthRequest,res,next)=>{
    const userId = req.user?.id ?? req.ip ?? 'anonymous';

    const limited = await isRateLimited(
        userId,
        req.path,
        100, // limit
        900 // window in seconds
    );

    if(limited){
        return res.status(429).json({message: 'Too many requests, please try again later.'});
    }
    next();
})

app.get('/api/health', (req, res) => {
    res.status(200).send('API Gateway is healthy');
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/simulations', simulationRoutes);

// error handler
app.use(errorHandler);

// initialize websocket server
initializeSocketServer(httpServer);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`WebSocket Server ready `);
});


