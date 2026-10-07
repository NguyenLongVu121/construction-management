const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME || "construction_management",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
});

module.exports = pool;