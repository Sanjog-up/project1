export enum Role {
    ADMIN = "Admin",
    USER = "User",
    SUPER_ADMIN = "Super_admin",

}
export const All_Users = Object.values(Role);
export const Only_Users = [Role.USER];
export const Only_Admins = [Role.ADMIN, Role.SUPER_ADMIN];
// Object.values(obj) => []
