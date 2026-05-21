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
});

export const db = drizzle(pool);

/**
 * Wraps a database query in a try-catch block to prevent full-page crashes.
 * @param {Promise} queryPromise - The Drizzle query promise.
 * @param {any} fallback - The fallback value to return on failure (default: []).
 * @returns {Promise<{data: any, error: boolean}>}
 */
export async function safeQuery(queryPromise, fallback = []) {
  try {
    const data = await queryPromise;
    return { data, error: false };
  } catch (err) {
    console.error("Database query failed:", err);
    return { data: fallback, error: true };
  }
}
