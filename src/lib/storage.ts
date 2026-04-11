import fs from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.resolve("storage/contracts");

export const ensureContractDir = async (contractId: string): Promise<string> => {
  const dir = path.join(STORAGE_ROOT, contractId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

export const getContractFilePath = (contractId: string, filename: string): string => {
  return path.join(STORAGE_ROOT, contractId, filename);
};