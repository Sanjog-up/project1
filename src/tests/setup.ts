import "dotenv/config";
import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await mongoose.connect(mongo.getUri());
  if (mongoose.connection.port === 27017) {
    throw new Error("Tests must never run against the real MongoDB");
  }
});
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
