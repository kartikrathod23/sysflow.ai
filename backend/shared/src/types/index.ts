export type UserRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: UserRole;
  joined_at: Date;
}

export type NodeType =
  | 'API_GATEWAY'
  | 'LOAD_BALANCER'
  | 'MICROSERVICE'
  | 'DATABASE'
  | 'CACHE'
  | 'MESSAGE_QUEUE'
  | 'CDN'
  | 'EXTERNAL_API';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  config: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface SystemGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type SimulationStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface SimulationRun {
  id: string;
  system_design_id: string;
  status: SimulationStatus;
  config_json: any;
  result_summary_json?: any;
  started_at?: Date;
  ended_at?: Date;
  created_at: Date;
}
