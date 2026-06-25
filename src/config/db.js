const mysql = require("mysql2/promise");

const poolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "github_analyzer",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 20000,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

const pool = mysql.createPool(poolConfig);

const initializeDatabase = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS github_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255),
      bio TEXT,
      location VARCHAR(255),
      email VARCHAR(255),
      blog VARCHAR(500),
      company VARCHAR(255),
      avatar_url VARCHAR(500),
      github_url VARCHAR(500),
      public_repos INT DEFAULT 0,
      public_gists INT DEFAULT 0,
      followers INT DEFAULT 0,
      following INT DEFAULT 0,
      total_stars INT DEFAULT 0,
      total_forks INT DEFAULT 0,
      most_used_language VARCHAR(100),
      top_repos JSON,
      account_created_at DATETIME,
      last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.execute(createTableQuery);
    console.log("Database table initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database table:", error.code, error.message);
    console.error("DB Config → host:", process.env.DB_HOST, "port:", process.env.DB_PORT, "db:", process.env.DB_NAME, "user:", process.env.DB_USER, "ssl:", process.env.DB_SSL);
    throw error;
  }
};

module.exports = { pool, initializeDatabase };
