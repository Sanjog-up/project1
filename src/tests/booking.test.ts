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
        skills: ["plumber"],
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
            serviceType: "plumber",
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