import pg from 'pg'

const { Pool } = ('pg')

const pool = global.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

if (process.env.NODE_ENV !== 'production'){
    global.pool = pool
}

export default pool