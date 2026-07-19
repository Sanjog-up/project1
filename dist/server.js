"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const db_config_1 = __importDefault(require("./config/db.config"));
const PORT = process.env.PORT || 8000;
const DB_URI = process.env.DB_URI;
const server = async () => {
    await (0, db_config_1.default)(DB_URI);
    app_1.default.listen(PORT, () => {
        console.log(`server is running on http://localhost:${PORT}`);
    });
};
exports.server = server;
(0, exports.server)();
