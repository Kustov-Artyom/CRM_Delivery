import { resolve } from "node:path";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";

const databasePath = resolve(process.env.SQLITE_PATH || "data/crm.sqlite");
const database = openDatabase(databasePath);
const app = createApp({ database });
const port = Number(process.env.API_PORT || 3001);

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Invitation API listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
