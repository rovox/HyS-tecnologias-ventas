/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("salesperson_goals");

  const record0 = new Record(collection);
    record0.set("salesperson_name", "Dennis Palacios");
    record0.set("monthly_goal", 15000);
    record0.set("annual_goal", 180000);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("salesperson_name", "Wilson Fernandez");
    record1.set("monthly_goal", 15000);
    record1.set("annual_goal", 180000);
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})