import fs from "fs";
import { MongoClient } from "mongodb";
import path from "path";
import { promisify } from "util";
import { createDirectory } from "../utils/utils";

export async function generateBackup(client: MongoClient, databaseName: string) {
  if (!databaseName) {
    throw new Error("Missing database name");
  }

  const db = client.db(databaseName);
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((collection) => collection.name);

  await createDirectory(path.join(__dirname, "..", "..", "backups"));
  const folderName = `${databaseName}-${Date.now()}`;
  const dir = path.join(__dirname, "..", "..", "backups", folderName);
  await createDirectory(dir);

  console.log(`Generating backup for database ${databaseName}.`);

  for (const collectionName of collectionNames) {
    console.log("*****");
    console.log(`Generating backup for collection ${collectionName}`);

    if (collectionName !== "whatsapp_messages") continue;

    const documents = await db.collection(collectionName).find().toArray();
    console.log(`Found ${documents.length} documents in collection ${collectionName}`);

    const filePath = path.join(dir, `${collectionName}.json`);
    await promisify(fs.writeFile)(filePath, JSON.stringify(documents, null, 2), "utf8");

    console.log(`Backup generated for collection ${collectionName}`);
    console.log("*****");
  }

  console.log(`Generated backup for database ${databaseName}.`);
  console.log(`Backup saved in ${dir}`);

  return dir;
}
