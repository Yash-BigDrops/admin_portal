import { NextResponse } from 'next/server';
import { getPool } from '@/lib/database/db';

export async function POST() {
  try {
    const pool = getPool();
    
    console.log('Fixing schema mismatch between users and accounts/sessions tables...');
    
    // First, let's check if we need to convert user_id from integer to UUID
    const accountsCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'user_id' AND table_schema = 'public'
    `);
    
    const sessionsCheck = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' AND column_name = 'user_id' AND table_schema = 'public'
    `);
    
    if (accountsCheck.rows[0]?.data_type === 'integer') {
      console.log('Converting accounts.user_id from integer to UUID...');
      
      // Add a new UUID column
      await pool.query(`
        ALTER TABLE accounts ADD COLUMN user_id_uuid UUID;
      `);
      
      // Update the new column with converted values
      await pool.query(`
        UPDATE accounts 
        SET user_id_uuid = (
          SELECT id FROM users 
          WHERE users.id::text = accounts.user_id::text
        );
      `);
      
      // Drop the old column and rename the new one
      await pool.query(`
        ALTER TABLE accounts DROP COLUMN user_id;
      `);
      
      await pool.query(`
        ALTER TABLE accounts RENAME COLUMN user_id_uuid TO user_id;
      `);
      
      // Add NOT NULL constraint
      await pool.query(`
        ALTER TABLE accounts ALTER COLUMN user_id SET NOT NULL;
      `);
    }
    
    if (sessionsCheck.rows[0]?.data_type === 'integer') {
      console.log('Converting sessions.user_id from integer to UUID...');
      
      // Add a new UUID column
      await pool.query(`
        ALTER TABLE sessions ADD COLUMN user_id_uuid UUID;
      `);
      
      // Update the new column with converted values
      await pool.query(`
        UPDATE sessions 
        SET user_id_uuid = (
          SELECT id FROM users 
          WHERE users.id::text = sessions.user_id::text
        );
      `);
      
      // Drop the old column and rename the new one
      await pool.query(`
        ALTER TABLE sessions DROP COLUMN user_id;
      `);
      
      await pool.query(`
        ALTER TABLE sessions RENAME COLUMN user_id_uuid TO user_id;
      `);
      
      // Add NOT NULL constraint
      await pool.query(`
        ALTER TABLE sessions ALTER COLUMN user_id SET NOT NULL;
      `);
    }
    
    // Re-add foreign key constraints
    try {
      await pool.query(`
        ALTER TABLE accounts ADD CONSTRAINT fk_accounts_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      // Constraint might already exist
    }
    
    try {
      await pool.query(`
        ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      `);
    } catch (e) {
      // Constraint might already exist
    }
    
    // Verify the changes
    const accountsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'user_id' AND table_schema = 'public'
    `);
    
    const sessionsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' AND column_name = 'user_id' AND table_schema = 'public'
    `);
    
    console.log('Schema fix completed successfully!');
    console.log('Accounts user_id type:', accountsSchema.rows[0]?.data_type);
    console.log('Sessions user_id type:', sessionsSchema.rows[0]?.data_type);
    
    return NextResponse.json({
      success: true,
      message: 'Schema mismatch fixed successfully!',
      accountsUserIdType: accountsSchema.rows[0]?.data_type,
      sessionsUserIdType: sessionsSchema.rows[0]?.data_type
    });

  } catch (error) {
    console.error('Schema fix error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Schema fix failed'
      },
      { status: 500 }
    );
  }
}
