import pg from 'pg';

const pool = new pg.Pool({
    connectionString: ``
});

export default pool;