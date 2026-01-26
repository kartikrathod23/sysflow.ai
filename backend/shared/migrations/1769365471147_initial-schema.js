exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createType('workspace_role', ['OWNER', 'EDITOR', 'VIEWER', 'ADMIN']);
  pgm.createType('simulation_status', ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']);
  pgm.createType('ai_review_type', ['ARCHITECTURE_REVIEW', 'BOTTLENECK_ANALYSIS', 'INFRA_CODE']);

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createTable('workspaces', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'varchar(255)', notNull: true },
    owner_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createTable('workspace_members', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    workspace_id: { type: 'uuid', notNull: true, references: 'workspaces', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    role: { type: 'workspace_role', notNull: true },
    joined_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createConstraint('workspace_members', 'unique_workspace_user', {
    unique: ['workspace_id', 'user_id']
  });

  pgm.createTable('system_designs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    workspace_id: { type: 'uuid', notNull: true, references: 'workspaces', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    graph_json: { type: 'jsonb', notNull: true, default: '{"nodes": [], "edges": []}' },
    version: { type: 'integer', notNull: true, default: 1 },
    created_by: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('system_designs', 'graph_json', { method: 'gin' });

  pgm.createTable('simulation_runs', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    system_design_id: { type: 'uuid', notNull: true, references: 'system_designs', onDelete: 'CASCADE' },
    status: { type: 'simulation_status', notNull: true, default: 'QUEUED' },
    config_json: { type: 'jsonb', notNull: true },
    result_summary_json: { type: 'jsonb' },
    started_at: { type: 'timestamp' },
    ended_at: { type: 'timestamp' },
    created_by: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('simulation_runs', 'status');

  pgm.createTable('ai_reviews', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    system_design_id: { type: 'uuid', notNull: true, references: 'system_designs', onDelete: 'CASCADE' },
    review_type: { type: 'ai_review_type', notNull: true },
    feedback_text: { type: 'text', notNull: true },
    generated_code: { type: 'text' },
    metadata_json: { type: 'jsonb' },
    created_by: { type: 'uuid', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('ai_reviews');
  pgm.dropTable('simulation_runs');
  pgm.dropTable('system_designs');
  pgm.dropTable('workspace_members');
  pgm.dropTable('workspaces');
  pgm.dropTable('users');

  pgm.dropType('ai_review_type');
  pgm.dropType('simulation_status');
  pgm.dropType('workspace_role');
};
