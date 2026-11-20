import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import User from "../models/user.models";
import { Role } from "../types/enum.types";

const validUser = {
  full_name: "Test User",
  email: "test@gmail.com",
  password: "Password123!"
};

const register = (body: object) =>  
    request(app).post("/api/auth/register").send(body);

describe("POST /api/auth/register", () => {
    it("creates a new user account and returns a token", async () => {
        const res = await register(validUser);
        expect(res.status).toBe(201);
        expect(res.body.data.access_token).toBeDefined();
        expect(res.body.data.user.email).toBe("test@gmail.com");
        expect(res.body.data.user.full_name).toBe("Test User");
    });

    it("ignores a role sent by client and sets it to USER", async () => {
        const res = await register({ ...validUser, role: Role.ADMIN });
        expect(res.status).toBe(201);
        const saved = await User.findOne({ email: validUser.email });
        expect(saved?.role).toBe(Role.USER);
    });

    it("never returns a paasword hash in the response", async () => {
        const res = await register(validUser);
        const saved = await User.findOne({ email: validUser.email }).select("+password");
        expect(res.body.data.user).not.toHaveProperty("password");
        expect(saved?.password).toBeDefined();
        expect(res.body.data.user.password).toBeUndefined();
    });

    it("stores password as a hash and not in plain text", async () => {
        await register(validUser);
        const saved = await User.findOne({ email: validUser.email }).select("+password");
        expect(saved?.password).not.toBe(validUser.password);
    });
});