"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dialects = void 0;
const mssql_1 = require("./mssql");
const mysql_1 = require("./mysql");
const postgres_1 = require("./postgres");
const sqlite_1 = require("./sqlite");
exports.dialects = {
    mssql: mssql_1.mssqlOptions,
    mysql: mysql_1.mysqlOptions,
    mariadb: mysql_1.mysqlOptions,
    postgres: postgres_1.postgresOptions,
    sqlite: sqlite_1.sqliteOptions
};
//# sourceMappingURL=dialects.js.map