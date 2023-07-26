import dotenv from "dotenv";
import { copyCrossAccountDatabases, copyDatabase } from "./functions/copy-database";
import { generateBackup } from "./functions/generate-backup";
import { closeMongoDBConnection, connectToMongoDB } from "./utils/mongodb-connection";

enum ProjectFunction {
  GENERATE_BACKUP = "generate-backup",
  COPY_DATABASE = "copy-database",
  COPY_CROSS_ACCOUNT_DATABASES = "copy-cross-account-databases",
}

async function main() {
  dotenv.config({ path: ".env" });
  const method = process.env.PROJECT_FUNCTION;

  if (method === ProjectFunction.COPY_CROSS_ACCOUNT_DATABASES) {
    return copyCrossAccountDatabases();
  }

  const client = await connectToMongoDB();

  try {
    console.log(`Running method: ${method}`);

    if (method === ProjectFunction.GENERATE_BACKUP) {
      await generateBackup(client, process.env.MONGODB_DATABASE);
    }

    if (method === ProjectFunction.COPY_DATABASE) {
      await copyDatabase(client, process.env.MONGODB_DATABASE, process.env.MONGODB_NEW_DATABASE);
    }

    console.log("Done");
  } catch (err) {
    console.error(err);
  } finally {
    await closeMongoDBConnection(client);
  }
}

main();
