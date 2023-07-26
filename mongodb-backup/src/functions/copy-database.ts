import { MongoClient } from "mongodb";
import { closeMongoDBConnection, createMongoDbConnection } from "../utils/mongodb-connection";

export async function copyDatabase(
  client: MongoClient,
  databaseName: string,
  newDatabaseName: string
) {
  if (!databaseName) {
    throw new Error("Database name is required");
  }
  if (!newDatabaseName) {
    throw new Error("New database name is required");
  }
  if (databaseName === newDatabaseName) {
    throw new Error("Database name and new database name cannot be the same");
  }

  console.log(`Copying database: ${databaseName} to ${newDatabaseName}`);

  const db = client.db(databaseName);
  const collections = await db.listCollections().toArray();

  const newDb = client.db(newDatabaseName);
  console.log(`Dropping database: ${newDatabaseName}`);
  await newDb.dropDatabase();

  for (const collection of collections) {
    const collectionName = collection.name;
    console.log("*****");
    console.log("Copying collection: ", collectionName);

    const collectionData = await db.collection(collectionName).find().toArray();
    await newDb.collection(collectionName).insertMany(collectionData);

    console.log(`Copied ${collectionName} documents: ${collectionData.length}`);
    console.log("*****");
  }

  console.log(`Copied database: ${databaseName} to ${newDatabaseName}`);
}

export async function copyCrossAccountDatabases() {
  const databaseName = process.env.MONGODB_DATABASE;
  if (!databaseName) {
    throw new Error("Root Database name is required");
  }

  const newDatabaseName = process.env.MONGODB_DATABASE_2;
  if (!newDatabaseName) {
    throw new Error("New Database name is required");
  }

  const client1 = await createMongoDbConnection({
    username: process.env.MONGODB_USERNAME,
    password: process.env.MONGODB_PASSWORD,
    host: process.env.MONGODB_HOST,
  });

  const client2 = await createMongoDbConnection({
    username: process.env.MONGODB_USERNAME_2,
    password: process.env.MONGODB_PASSWORD_2,
    host: process.env.MONGODB_HOST_2,
  });

  try {
    const db1 = client1.db(databaseName);
    const collections = await db1.listCollections().toArray();

    const db2 = client2.db(newDatabaseName);
    console.log(`Dropping database: ${newDatabaseName}`);
    await db2.dropDatabase();

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log("*****");
      console.log("Copying collection: ", collectionName);

      const collectionData = await db1.collection(collectionName).find().toArray();
      console.log("collectionData", collectionData.length);
      if (collectionData.length === 0) {
        console.log(`No documents found in ${collectionName}`);
        continue;
      }
      await db2.collection(collectionName).insertMany(collectionData);

      console.log(`Copied ${collectionName} documents: ${collectionData.length}`);
      console.log("*****");
    }

    console.log(`Copied database: ${databaseName} to ${newDatabaseName}`);
  } catch (err) {
    throw err;
  } finally {
    await closeMongoDBConnection(client1);
    await closeMongoDBConnection(client2);
  }
}
