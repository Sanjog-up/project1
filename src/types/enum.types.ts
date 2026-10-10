export enum Role {
    ADMIN = "Admin",
    USER = "User",
    SUPER_ADMIN = "Super_admin",
    WORKER = "Worker"
}

export const Only_Admins = [Role.ADMIN, Role.SUPER_ADMIN];