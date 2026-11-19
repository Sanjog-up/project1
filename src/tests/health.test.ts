import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app";

describe("GET /", () => {
    it("responds that the server is up", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("server is up and running");
        expect(res.body.success).toBe(true);
    });
});