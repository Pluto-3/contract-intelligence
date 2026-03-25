import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "../config/index.js";

const queryClient = postgres(config.databaseUrl);
export const db = drizzle(queryClient);

export const checkDbConnection = async (): Promise<boolean> => {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};