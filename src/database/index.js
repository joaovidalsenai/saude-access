import { Sequelize } from 'sequelize'
import dbConfig from '../config/db.js'

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    define: dbConfig.define,
    pool: dbConfig.pool
  }
)

export default sequelize