"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Only_Admins = exports.Only_Users = exports.All_Users = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "Admin";
    Role["USER"] = "User";
    Role["SUPER_ADMIN"] = "Super_admin";
})(Role || (exports.Role = Role = {}));
exports.All_Users = Object.values(Role);
exports.Only_Users = [Role.USER];
exports.Only_Admins = [Role.ADMIN, Role.SUPER_ADMIN];
// Object.values(obj) => []
