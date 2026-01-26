require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL

})

async function seed(){
    const client = await pool.connect();
    try{
        console.log("Seeding database...");

        await client.query('BEGIN');
        const passwordHash = await bcrypt.hash('password123', 10);

        const userResult = await client.query(
            `INSERT INTO users (email,password_hash,name) VALUES ($1,$2,$3) RETURNING id`,
            ['test@sysflow.ai',passwordHash,'Test User']
        );

        const userId = userResult.rows[0].id;

        const workspaceResult = await client.query(
            `INSERT INTO workspaces (name,owner_id) VALUES ($1,$2) RETURNING id`,
            ['Test Workspace',userId]
        );

        const workspaceId = workspaceResult.rows[0].id;
        console.log("Workspace ID:", workspaceId);

        await client.query(
            `INSERT INTO workspace_members (workspace_id,user_id,role) VALUES ($1,$2,$3)`,
            [workspaceId,userId,'ADMIN']
        );

        console.log("Added user to workspace.");

        // Create sample system design (graph)
        const sampleGraph = {
            nodes: [
                {
                    id: 'api-gw-1',
                    type: 'API_GATEWAY',
                    name: 'API Gateway',
                    position: { x: 100, y: 100 },
                    config: { maxRps: 5000, avgLatencyMs: 10 }
                },
                {
                    id: 'svc-1',
                    type: 'MICROSERVICE',
                    name: 'Order Service',
                    position: { x: 300, y: 100 },
                    config: { maxRps: 1000, avgLatencyMs: 50, cpu: 2, memoryMb: 512 }
                },
                {
                    id: 'db-1',
                    type: 'DATABASE',
                    name: 'PostgreSQL',
                    position: { x: 500, y: 100 },
                    config: { maxConnections: 100, avgQueryMs: 20 }
                }
            ],
            edges: [
                { id: 'e1', from: 'api-gw-1', to: 'svc-1', label: 'HTTP' },
                { id: 'e2', from: 'svc-1', to: 'db-1', label: 'SQL' }
            ]
        };

        await client.query(
            `
            INSERT INTO system_designs 
            (workspace_id, name, description, graph_json, created_by)
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
                workspaceId,
                'Sample Microservices Architecture',
                'Seeded example system design',
                JSON.stringify(sampleGraph),
                userId
            ]
        );

        console.log('✅ Created system design');

        await client.query('COMMIT');

        console.log('🌱 Database seed completed successfully!');
        console.log('🔑 Login: test@sysflow.ai / password123');
    }
    catch(err){
        await client.query('ROLLBACK');
        console.error('Error seeding database:', err);
    }
    finally{
        client.release();
        pool.end();
    }
}

seed();