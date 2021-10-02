"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCondition = exports.addTicks = void 0;
const sequelize_1 = require("sequelize");
function addTicks(value) {
    return sequelize_1.Utils.addTicks(value, "'");
}
exports.addTicks = addTicks;
function makeCondition(columnName, value) {
    return value ? ` AND ${columnName} = ${addTicks(value)} ` : "";
}
exports.makeCondition = makeCondition;
//# sourceMappingURL=dialect-options.js.map