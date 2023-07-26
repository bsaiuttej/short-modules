import { promisify } from "util";
import fs from "fs";

export async function createDirectory(path: string) {
  const exists = await promisify(fs.exists)(path);
  if (!exists) {
    await promisify(fs.mkdir)(path);
  }
}
