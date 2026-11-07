import "./env"
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
} from "vitest";
import User from "../models/user.models";
import { WorkerProfile } from "../models/worker.model";
import { Booking } from "../models/booking.model";
import { Role } from "../types/enum.types";

// Fake Cloudinary: no internet, no cost. Behaves like the real helper (it removes the temp file).
vi.mock("../utils/cloudinary.utils", () => ({
  sendFileToCloudinary: vi.fn(async (file: { path: string }) => {
    const fs = await import("node:fs");
    fs.rmSync(file.path, { force: true });
    return {
      public_id: `fake/${Date.now()}-${Math.random()}`,
      path: "https://fake.test/x",
      format: "png",
    };
  }),
  deleteFileFromCloudinary: vi.fn(async () => true),
}));

import {
  sendFileToCloudinary,
  deleteFileFromCloudinary,
} from "../utils/cloudinary.utils";
import {
  api,
  authHeader,
  connectTestDb,
  disconnectTestDb,
  createAdminToken,
  createService,
  registerUser,
  sendWorkerApplication,
  makeVerifiedWorker,
  createBooking,
  acceptBooking,
} from "./helpers";

let adminToken: string;

beforeAll(async () => {
  await connectTestDb();
  adminToken = await createAdminToken();
  await createService(adminToken, "Plumber");
});
afterAll(disconnectTestDb);
beforeEach(() => vi.clearAllMocks());

describe("worker onboarding", () => {
  it("rejects an application without the back of the citizenship and keeps the role User", async () => {
    const u = await registerUser("worker");
    const res = await sendWorkerApplication(u.token, { back: false });
    expect(res.status).toBe(400);
    expect((await User.findById(u.id))?.role).toBe(Role.USER);
  });

  it("accepts a full application, uploads documents as private, and does not leak them", async () => {
    const u = await registerUser("worker");
    const res = await sendWorkerApplication(u.token);
    expect(res.status).toBe(201);
    expect((await User.findById(u.id))?.role).toBe(Role.WORKER);

    const calls = vi.mocked(sendFileToCloudinary).mock.calls;
    expect(calls).toHaveLength(3); // front, back, license
    for (const call of calls) expect(call[2]).toEqual({ private: true });
    expect(JSON.stringify(res.body)).not.toContain("public_id");
  });

  it("rolls back when an upload fails: role returns to User and uploaded files are deleted", async () => {
    vi.mocked(sendFileToCloudinary)
      .mockResolvedValueOnce({ public_id: "front-1", path: "x", format: "png" })
      .mockRejectedValueOnce(new Error("cloudinary down"));

    const u = await registerUser("worker");
    const res = await sendWorkerApplication(u.token);
    expect(res.status).toBe(500);
    expect((await User.findById(u.id))?.role).toBe(Role.USER);
    expect(await WorkerProfile.countDocuments({ user: u.id })).toBe(0);
    expect(deleteFileFromCloudinary).toHaveBeenCalledWith(
      "front-1",
      "authenticated",
    );
  });
});

describe("verification and the booking pool", () => {
  it("an unverified worker cannot see bookings (403)", async () => {
    const u = await registerUser("worker");
    const applied = await sendWorkerApplication(u.token);
    const res = await api()
      .get("/api/bookings/available?lat=27.71&lng=85.32")
      .set(authHeader(applied.body.data.access_token));
    expect(res.status).toBe(403);
  });

  it("a verified worker sees nearby bookings without the address and with blurred coordinates", async () => {
    const customer = await registerUser("customer");
    expect((await createBooking(customer.token)).status).toBe(201);
    const worker = await makeVerifiedWorker(adminToken);

    const res = await api()
      .get("/api/bookings/available?lat=27.71&lng=85.32")
      .set(authHeader(worker.token));
    expect(res.status).toBe(200);
    const [booking] = res.body.data.bookings;
    expect(booking.location.address).toBeUndefined();
    expect(booking.location.coordinates).toEqual([85.32, 27.71]);
  });

  it("two workers accepting the same booking at the same time: exactly one wins", async () => {
    const customer = await registerUser("customer");
    const created = await createBooking(customer.token);
    const id = created.body.data._id as string;
    const w1 = await makeVerifiedWorker(adminToken);
    const w2 = await makeVerifiedWorker(adminToken);

    const [r1, r2] = await Promise.all([
      acceptBooking(w1.token, id),
      acceptBooking(w2.token, id),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([200, 404]);

    const winner = r1.status === 200 ? w1 : w2;
    const saved = await Booking.findById(id);
    expect(String(saved?.worker)).toBe(winner.userId);
  });
});

describe("private documents", () => {
  it("an admin gets temporary links, and a normal worker is refused", async () => {
    const worker = await makeVerifiedWorker(adminToken);

    const asAdmin = await api()
      .get(`/api/workers/${worker.workerId}/documents`)
      .set(authHeader(adminToken));
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.data.citizenshipFront).toContain("type=authenticated");
    expect(asAdmin.body.data.citizenshipFront).toContain("expires_at=");
    expect(asAdmin.body.data.nid).toBeNull();

    const asWorker = await api()
      .get(`/api/workers/${worker.workerId}/documents`)
      .set(authHeader(worker.token));
    expect(asWorker.status).toBe(403);
  });
});
