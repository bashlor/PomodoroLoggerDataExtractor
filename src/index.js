import { config } from "dotenv";
import * as Duration from "tinyduration";
import { getNedbDatabaseHandler } from "./db.js";

config();

const db = getNedbDatabaseHandler();

const { kanban } = db;

kanban.find({}, (err, docs) => {
  if (err) {
    console.error(err);
    return;
  }

  const docs2 = docs.map((doc) => {
    return {
      ...doc,
      lastVisitTime: new Date(doc.lastVisitTime),
      spentHours: spentHoursToISODuration(doc.spentHours),
    };
  });

  console.log(docs2);
});

function spentHoursToISODuration(spentHours) {
  const totalMinutes = Math.floor(spentHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const durationObject = Duration.serialize({
    hours,
    minutes,
  });
  return durationObject;
}
