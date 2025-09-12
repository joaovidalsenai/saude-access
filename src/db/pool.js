import pg from 'pg';

const password = ``

const pool = new pg.Pool({
    connectionString: `postgresql://postgres:${password}@db.dazczejlredrhvwjdzyt.supabase.co:5432/postgres`
});

export default pool;