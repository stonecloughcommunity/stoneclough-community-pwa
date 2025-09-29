#!/usr/bin/env tsx

/**
 * Database Migration Runner
 * 
 * This script runs all database migrations in order to set up the complete schema.
 * It can be used for initial setup or to apply new migrations.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Migration {
  filename: string;
  order: number;
  sql: string;
}

async function createMigrationsTable() {
  console.log('📋 Creating migrations tracking table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum TEXT,
        execution_time_ms INTEGER
      );
      
      -- Enable RLS but allow system access
      ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "System can manage migrations" ON public.schema_migrations
        FOR ALL USING (true);
    `
  });

  if (error) {
    console.error('❌ Failed to create migrations table:', error.message);
    throw error;
  }
  
  console.log('✅ Migrations table ready');
}

async function getAppliedMigrations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('filename');

  if (error) {
    console.error('❌ Failed to get applied migrations:', error.message);
    throw error;
  }

  return data?.map(row => row.filename) || [];
}

async function recordMigration(filename: string, executionTime: number) {
  const { error } = await supabase
    .from('schema_migrations')
    .insert({
      filename,
      execution_time_ms: executionTime,
    });

  if (error) {
    console.error(`❌ Failed to record migration ${filename}:`, error.message);
    throw error;
  }
}

function loadMigrations(): Migration[] {
  const scriptsDir = join(__dirname);
  const files = readdirSync(scriptsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  const migrations: Migration[] = [];

  for (const filename of files) {
    const match = filename.match(/^(\d+)_/);
    const order = match ? parseInt(match[1], 10) : 999;
    
    const filepath = join(scriptsDir, filename);
    const sql = readFileSync(filepath, 'utf-8');
    
    migrations.push({
      filename,
      order,
      sql,
    });
  }

  return migrations.sort((a, b) => a.order - b.order);
}

async function executeMigration(migration: Migration): Promise<number> {
  console.log(`🔄 Applying migration: ${migration.filename}`);
  
  const startTime = Date.now();
  
  // Split SQL into individual statements
  const statements = migration.sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        console.error(`❌ Failed to execute statement in ${migration.filename}:`);
        console.error(`   Statement: ${statement.substring(0, 100)}...`);
        console.error(`   Error: ${error.message}`);
        throw error;
      }
    }
  }
  
  const executionTime = Date.now() - startTime;
  console.log(`✅ Applied ${migration.filename} (${executionTime}ms)`);
  
  return executionTime;
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  try {
    // Create migrations tracking table
    await createMigrationsTable();

    // Get list of applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`📊 Found ${appliedMigrations.length} previously applied migrations`);

    // Load all migration files
    const migrations = loadMigrations();
    console.log(`📁 Found ${migrations.length} migration files\n`);

    // Filter out already applied migrations
    const pendingMigrations = migrations.filter(
      migration => !appliedMigrations.includes(migration.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log('✅ All migrations are up to date!');
      return;
    }

    console.log(`🔄 Applying ${pendingMigrations.length} pending migrations:\n`);

    // Apply each pending migration
    for (const migration of pendingMigrations) {
      const executionTime = await executeMigration(migration);
      await recordMigration(migration.filename, executionTime);
    }

    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  }
}

async function showStatus() {
  console.log('📊 Migration Status\n');

  try {
    const appliedMigrations = await getAppliedMigrations();
    const allMigrations = loadMigrations();

    console.log('Applied Migrations:');
    if (appliedMigrations.length === 0) {
      console.log('  (none)');
    } else {
      appliedMigrations.forEach(filename => {
        console.log(`  ✅ ${filename}`);
      });
    }

    console.log('\nPending Migrations:');
    const pendingMigrations = allMigrations.filter(
      migration => !appliedMigrations.includes(migration.filename)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('  (none)');
    } else {
      pendingMigrations.forEach(migration => {
        console.log(`  ⏳ ${migration.filename}`);
      });
    }

    console.log(`\nTotal: ${appliedMigrations.length}/${allMigrations.length} migrations applied`);

  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    process.exit(1);
  }
}

async function resetDatabase() {
  console.log('⚠️  DANGER: This will drop all tables and data!');
  console.log('This action cannot be undone.\n');

  // In a real implementation, you'd want confirmation prompts here
  console.log('🔄 Dropping all tables...');

  try {
    // Drop all custom tables (be very careful with this!)
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all tables in dependency order
        DROP TABLE IF EXISTS public.schema_migrations CASCADE;
        DROP TABLE IF EXISTS public.content_moderation CASCADE;
        DROP TABLE IF EXISTS public.rate_limits CASCADE;
        DROP TABLE IF EXISTS public.audit_log CASCADE;
        DROP TABLE IF EXISTS public.user_sessions CASCADE;
        DROP TABLE IF EXISTS public.environmental_participants CASCADE;
        DROP TABLE IF EXISTS public.environmental_initiatives CASCADE;
        DROP TABLE IF EXISTS public.job_applications CASCADE;
        DROP TABLE IF EXISTS public.job_postings CASCADE;
        DROP TABLE IF EXISTS public.business_reviews CASCADE;
        DROP TABLE IF EXISTS public.committee_members CASCADE;
        DROP TABLE IF EXISTS public.committees CASCADE;
        DROP TABLE IF EXISTS public.role_assignments CASCADE;
        DROP TABLE IF EXISTS public.organization_roles CASCADE;
        DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
        DROP TABLE IF EXISTS public.notification_preferences CASCADE;
        DROP TABLE IF EXISTS public.notifications CASCADE;
        DROP TABLE IF EXISTS public.prayer_responses CASCADE;
        DROP TABLE IF EXISTS public.prayer_requests CASCADE;
        DROP TABLE IF EXISTS public.volunteer_applications CASCADE;
        DROP TABLE IF EXISTS public.volunteer_opportunities CASCADE;
        DROP TABLE IF EXISTS public.event_registrations CASCADE;
        DROP TABLE IF EXISTS public.events CASCADE;
        DROP TABLE IF EXISTS public.directory_entries CASCADE;
        DROP TABLE IF EXISTS public.comments CASCADE;
        DROP TABLE IF EXISTS public.post_likes CASCADE;
        DROP TABLE IF EXISTS public.posts CASCADE;
        DROP TABLE IF EXISTS public.profiles CASCADE;
        DROP TABLE IF EXISTS public.system_settings CASCADE;
        
        -- Drop all functions
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
        DROP FUNCTION IF EXISTS update_post_stats() CASCADE;
        DROP FUNCTION IF EXISTS update_prayer_count() CASCADE;
        DROP FUNCTION IF EXISTS archive_expired_prayers() CASCADE;
        DROP FUNCTION IF EXISTS create_notification_preferences() CASCADE;
      `
    });

    if (error) {
      console.error('❌ Failed to reset database:', error.message);
      throw error;
    }

    console.log('✅ Database reset complete');
    console.log('🔄 Run migrations to recreate schema');

  } catch (error) {
    console.error('💥 Reset failed:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'reset':
    resetDatabase();
    break;
  case 'run':
  default:
    runMigrations();
    break;
}

export { runMigrations, showStatus, resetDatabase };
