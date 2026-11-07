import request from "supertest";
import mongoose from "mongoose";
import { expect } from "vitest";
import app from "../app";
import User from "../models/user.models";
import { Role } from "../types/enum.types";

export const api = () => request(app);
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function connectTestDb() {
  const uri = process.env.DB_URI!;
  if (!uri.includes("_test"))
    throw new Error("Refusing to run tests on a non-test database");
  await mongoose.connect(uri);
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((m) => m.init()));
  await mongoose.connection.dropDatabase();
  await Promise.all(models.map((m) => m.syncIndexes())); // geo queries need their index
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
}

let counter = 0;
export async function registerUser(prefix = "user") {
  const email = `${prefix}${++counter}@test.com`;
  const res = await api()
    .post("/api/auth/register")
    .send({
      full_name: `${prefix} tester`,
      email,
      password: "secret123",
      phone: "9800000000",
    });
  expect(res.status).toBe(201);
  return {
    email,
    token: res.body.data.access_token as string,
    id: res.body.data.user._id as string,
  };
}

export async function createAdminToken() {
  const { email } = await registerUser("admin");
  await User.updateOne({ email }, { role: Role.ADMIN });
  const login = await api()
    .post("/api/auth/login")
    .send({ email, password: "secret123" });
  return login.body.data.access_token as string;
}

export const createService = (adminToken: string, name = "Plumber") =>
  api().post("/api/services").set(auth(adminToken)).send({ name, price: 500 });

const fakeImage = () => Buffer.from("fake-image-bytes");
const png = (name: string) => ({ filename: name, contentType: "image/png" });

export function sendWorkerApplication(
  token: string,
  opts: { back?: boolean } = {},
) {
  let req = api()
    .post("/api/auth/be-worker")
    .set(auth(token))
    .field("skills", JSON.stringify(["plumber"]))
    .field("location", JSON.stringify({ coordinates: [85.32, 27.71] }))
    .field("bio", "Ten years fixing pipes across Kathmandu valley.")
    .field("experience", "10")
    .attach("citizenship_front", fakeImage(), png("front.png"))
    .attach("license", fakeImage(), png("license.png"));
  if (opts.back !== false)
    req = req.attach("citizenship_back", fakeImage(), png("back.png"));
  return req;
}

export async function makeVerifiedWorker(adminToken: string) {
  const user = await registerUser("worker");
  const res = await sendWorkerApplication(user.token);
  expect(res.status).toBe(201);
  const workerId = res.body.data.workerId as string;
  const verify = await api()
    .patch(`/api/workers/${workerId}/verify`)
    .set(auth(adminToken));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return {
    token: res.body.data.access_token as string,
    userId: user.id,
    workerId,
  };
}

export const createBooking = (token: string) =>
  api()
    .post("/api/bookings")
    .set(auth(token))
    .send({
      serviceType: "plumber",
      description: "Leaking tap",
      location: {
        address: "Thamel, Kathmandu",
        coordinates: [85.32456, 27.71234],
      },
    });

export const acceptBooking = (token: string, id: string) =>
  api().patch(`/api/bookings/${id}/accept`).set(auth(token));

export const authHeader = auth;
