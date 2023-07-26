import { LocalStore } from "./local-store";

async function getUser(key: string, index: number) {
  const store = LocalStore.get<string>("user");
  if (!store) throw new Error("store not found");

  console.log(index, `started: ${new Date()}`);
  const user = await store.get(key);
  console.log(index, `ended: ${new Date()}`, user);
}

async function main() {
  LocalStore.create({
    storeName: "user",
    fn: async (key: string) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return key;
    },
  });

  for (let i = 0; i < 10; i++) {
    await getUser("user", i);
  }
}

main();
