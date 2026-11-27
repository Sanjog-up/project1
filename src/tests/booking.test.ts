import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";
import User from "../models/user.models";
import { Role } from "../types/enum.types";
import { Booking, BookingStatus } from "../models/booking.model";
import { WorkerProfile } from "../models/worker.model";
import { generateJwtToken } from "../utils/jwt.utils";

const fakeDoc = { public_id: "x", path: "x", format: "jpg" };

const makeUser = (email: string, role: Role) => User.create({
  full_name: "Test User",
  email,
  password: "Password123!",
  role,
});

const makeWorker = async(email: string) => {
    const user = await makeUser(email, Role.WORKER);
    await WorkerProfile.create({ 
        user: user._id, 
        citizenshipBack: fakeDoc,
        citizenshipFront: fakeDoc,
        skills: ["plumbing"],
        experience: 2,
        bio: "Experienced plumber with two years of work",
        isVerified: true,
        location: { type: "Point", coordinates: [85, 27] },
    });
    return {user, token: generateJwtToken(user._id)};
};

describe("PATCH /api/bookings/:id/accept", () => {
    it("lets only 1 worker accept the same booking", async () => {
        const customer = await makeUser("customer@test.com", Role.USER);
        const w1 = await makeWorker("w1@test.com");
        const w2 = await makeWorker("w2@test.com");

        const booking = await Booking.create({
            customer: customer._id,
            serviceType: "plumbing",
            location: { 
                type: "Point", 
                coordinates: [85, 27],
                address: "Kathmandu, Nepal"
            },
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        });

        const accept = (token: string) => request(app)
            .patch(`/api/bookings/${booking._id}/accept`)
            .set("Authorization", `Bearer ${token}`);

        const [r1, r2] = await Promise.all([
            accept(w1.token),
            accept(w2.token),
        ]);
        
        expect([r1.status, r2.status].sort()).toEqual([200, 404]);

        const profiles = await WorkerProfile.find({});
        const total = profiles.reduce((sum, p) => sum + p.scheduledJobsCount, 0);
        expect(total).toBe(1);
    });
});

const makeBooking = (customerId: any, extra: object = {}) =>
    Booking.create({
        customer: customerId,
        serviceType: "plumber",
        location: { 
            type: "Point", 
            coordinates: [85, 27],
            address: "Kathmandu, Nepal" 
        },
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        ...extra,
    });

describe("PATCH /api/bookings/:id/release", () => {
    it("lets a worker release a booking they have accepted and lower the counter once", async () => {
        const customer = await makeUser("customer@test.com", Role.USER);
        const w = await makeWorker("w@test.com");
        const booking = await makeBooking(customer._id, { 
            worker: w.user._id, 
            status: BookingStatus.Accepted });
            await WorkerProfile.updateOne({ 
                user: w.user._id }, 
                { $set: { scheduledJobsCount: 2 } });

        const release = () => request(app)
            .patch(`/api/bookings/${booking._id}/release`)
            .set("Authorization", `Bearer ${w.token}`);

        expect((await release()).status).toBe(200);
        expect((await release()).status).toBe(409);

        const updated = await Booking.findById(booking._id);
        expect(updated!.status).toBe(BookingStatus.Requested);
        expect(updated!.worker).toBeUndefined();

        const profile = await WorkerProfile.findOne({ user: w.user._id });
        expect(profile!.scheduledJobsCount).toBe(1);
    });
});

describe("PATCH /api/bookings/:id/cancel", () => {
    it("lets a customer cancel their booking and lower the counter if a worker was assigned", async () => {
        const customer = await makeUser("customer@test.com", Role.USER);
        const w = await makeWorker("w!@gmail.com");
        const booking = await makeBooking(customer._id, { 
            worker: w.user._id,
            status: BookingStatus.Accepted 
        });
        await WorkerProfile.updateOne({ 
            user: w.user._id }, 
            { $set: { scheduledJobsCount: 2 } });

        const cancel =  await request(app)
            .patch(`/api/bookings/${booking._id}/cancel`)
            .set("Authorization", `Bearer ${generateJwtToken(customer._id)}`)
            .send({ reason: "Change of plans" })

        expect(cancel.status).toBe(200);
        const updated = await Booking.findById(booking._id);
        expect(updated!.status).toBe(BookingStatus.Cancelled);
        expect(updated!.cancelledBy).toBe("User");

        const profile = await WorkerProfile.findOne({ user: w.user._id });
        expect(profile!.scheduledJobsCount).toBe(1);
    });
});

