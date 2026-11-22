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
        expect(saved!.password).not.toBe(validUser.password);
    });

    it.each([
        ["a tto-short name", { ...validUser, full_name: "ab" }, "full_name is required"],
        ["an invalid email", { ...validUser, email: "invalid-email" }, "email is required"],
        ["a weak password", { ...validUser, password: "123" }, "password is required"],
    ])("returns 400 for %s", async (_label, body) => {
        const res = await register(body);
        expect(res.status).toBe(400);
        expect(await User.countDocuments()).toBe(0);
    });

    it("returns 409 if email already exists", async () => {
        await register(validUser);
        const res = await register({...validUser, email: validUser.email.toUpperCase()});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Email already registered");
        expect(await User.countDocuments()).toBe(1);
    });
});

describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await register(validUser);
    });
    
    it("logs in a user with correct credentials", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: validUser.email,
            password: validUser.password
        });
        expect(res.status).toBe(200);
        expect(res.body.data.access_token).toBeDefined();
    });

    it("returns 400 for missing email or password", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: validUser.email });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("password is required");
    });

    it("returns 400 for incorrect password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: validUser.email,
            password: "WrongPassword"
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid credentials");
    });
    
    it("returns 400 for non-existent email", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "nonexistent@example.com",
            password: validUser.password
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid credentials");
    });

    it("gives a generic error message for invalid credentials", async () => {
        const wrongPass = await request(app).post("/api/auth/login").send({
            email: validUser.email,
            password: "WrongPassword"
        });
        const wrongEmail = await request(app).post("/api/auth/login").send({
            email: "nonexistent@example.com",
            password: validUser.password
        });
        expect(wrongPass.body.message).toBe("Invalid credentials");
        expect(wrongEmail.body.message).toBe("Invalid credentials");
        expect(wrongEmail.body.message).toBe("Invalid credentials");
    });
});