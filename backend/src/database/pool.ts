import mysql, {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { env } from "../config/env.js";

export const pool = mysql.createPool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  database: env.DATABASE_NAME,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  waitForConnections: true,
  connectionLimit: env.DATABASE_CONNECTION_LIMIT,
  enableKeepAlive: true,
  charset: "utf8mb4",
  timezone: "Z",
  decimalNumbers: true,
  namedPlaceholders: false,
});

export type DbConnection = PoolConnection | typeof pool;

export async function rows<T extends RowDataPacket[]>(
  sql: string,
  params: any[] = [],
  db: DbConnection = pool,
): Promise<T> {
  const [result] = await db.execute<T>(sql, params);
  return result;
}

export async function execute(
  sql: string,
  params: any[] = [],
  db: DbConnection = pool,
): Promise<ResultSetHeader> {
  const [result] = await db.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function transaction<T>(
  work: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function checkDatabase(): Promise<void> {
  await pool.query("SELECT 1");
}
