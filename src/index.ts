import { NedbDatabaseHandler } from "./db/db.js";
import { config } from "dotenv";
import { DataHandler } from "./data-handler.js";

config();

const dataSource = new DataHandler(new NedbDatabaseHandler());

await dataSource.init();

const kanbans = await dataSource.getKanbans();

console.log(kanbans);
