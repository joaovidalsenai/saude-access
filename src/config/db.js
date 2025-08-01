import dotenv from 'dotenv'
dotenv.config()

export default {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'my_database',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  define: {
    timestamps: true,
    underscored: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}