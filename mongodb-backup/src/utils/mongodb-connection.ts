import { MongoClient, ServerApiVersion } from "mongodb";

export async function connectToMongoDB() {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST;

  return createMongoDbConnection({ username, password, host });
}

type CreateMongoDBConnectionProps = {
  username: string;
  password: string;
  host: string;
};

export async function createMongoDbConnection(props: CreateMongoDBConnectionProps) {
  const { username, password, host } = props;

  if (!username || !password || !host) {
    console.log({ username, password, host });
    throw new Error("Missing MongoDB credentials");
  }

  const auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}`;
  const uri = `mongodb+srv://${auth}@${host}/test?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client
    .connect()
    .catch((err) => {
      console.error(err);
      throw err;
    })
    .then(() => {
      console.log("Connected successfully to mongodb database");
    });

  return client;
}

export async function closeMongoDBConnection(client: MongoClient) {
  try {
    await client.close();
    console.log("Closed MongoDB connection");
  } catch (err) {
    console.error(err);
  }
}
