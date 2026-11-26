import "dotenv/config";
import mongoose from "mongoose";
import USER from "../models/user.models";
import connectDatabase from "../config/db.config";
import { Service } from "../models/services.model";
import { Role } from "../types/enum.types";
import { hashPassword } from "../utils/bcrypt.utils";

const services = [
    { name: "Plumbing", slug: "plumbing", price: 800, requireLicense: true, description: "Fixing leaks, installing pipes, and other plumbing services." },
    { name: "Electrical", slug: "electrical", price: 800, requireLicense: true, description: "Wiring, lighting installation, and other electrical services." },
    { name: "Cleaning", slug: "cleaning", price: 800, requireLicense: false, description: "House cleaning, office cleaning, and other cleaning services." },
    { name: "Carpentry", slug: "carpentry", price: 800, requireLicense: true, description: "Furniture making, repairs, and other carpentry services." },
    { name: "Painting", slug: "painting", price: 800, requireLicense: false, description: "Interior and exterior painting services." },
];

const run = async () => {
    if(process.env.NODE_ENV === "production") {
        throw new Error("Refusing to run seed script in production environment");
    }
    const { DB_URI, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
    if (!DB_URI || !SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
        throw new Error("Missing required environment variables for seeding");
    }

    await connectDatabase(DB_URI);

    // Seed services upsert = update if exists, create if not
    for (const service of services) {
        await Service.updateOne(
            { slug: service.slug },
            { $set: { ...service, isActive: true } },
            { upsert: true }
        );
    }
    console.log(`Services ready: ${services.length}`);

    const email = SEED_ADMIN_EMAIL.toLowerCase();
    const existingAdmin = await USER.findOne({ email });
    if(existingAdmin) {
        console.log("Admin user already exists, skipping creation.");
    } else {
        await USER.create({
            full_name: "Admin User",
            email,
            password: await hashPassword(SEED_ADMIN_PASSWORD),
            role: Role.SUPER_ADMIN,
        });
        console.log(`Admin user created: ${email}`);
    }
};

run()
.catch((error) => {
    console.error("Error running seed script:", error);
    process.exitCode = 1;
})
.finally(() => {
    mongoose.disconnect()});