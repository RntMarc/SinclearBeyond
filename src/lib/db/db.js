import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  //ssl: { rejectUnauthorized: true }, // MariaDB externe Verbindung
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4_unicode_ci",
});

export const db = drizzle(pool);

/**
 * Wraps a database query in a try-catch block to prevent full-page crashes.
 * @param {Promise} query - The drizzle query promise.
 * @returns {Promise<{data: any, error: boolean}>}
 */
export async function safeQuery(query) {
  try {
    const data = await query;
    return { data, error: false };
  } catch (err) {
    console.error("--- DATABASE QUERY FAILED ---");
    console.error("Error:", err.message);
    if (err.sql) console.error("SQL:", err.sql);
    if (err.stack) console.error("Stack:", err.stack);
    console.error("-----------------------------");
    return { data: null, error: true };
  }
}
