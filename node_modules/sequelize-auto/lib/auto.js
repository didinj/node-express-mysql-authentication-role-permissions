"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequelizeAuto = void 0;
const lodash_1 = __importDefault(require("lodash"));
const sequelize_1 = require("sequelize");
const auto_builder_1 = require("./auto-builder");
const auto_generator_1 = require("./auto-generator");
const auto_relater_1 = require("./auto-relater");
const auto_writer_1 = require("./auto-writer");
const dialects_1 = require("./dialects/dialects");
class SequelizeAuto {
    constructor(database, username, password, options) {
        if (options && options.dialect === 'sqlite' && !options.storage && database) {
            options.storage = database;
        }
        if (options && options.dialect === 'mssql') {
            // set defaults for tedious, to silence the warnings
            options.dialectOptions = options.dialectOptions || {};
            options.dialectOptions.options = options.dialectOptions.options || {};
            options.dialectOptions.options.trustServerCertificate = true;
            options.dialectOptions.options.enableArithAbort = true;
            options.dialectOptions.options.validateBulkLoadParameters = true;
        }
        if (database instanceof sequelize_1.Sequelize) {
            this.sequelize = database;
        }
        else {
            this.sequelize = new sequelize_1.Sequelize(database, username, password, options || {});
        }
        this.options = lodash_1.default.extend({
            spaces: true,
            indentation: 2,
            directory: './models',
            additional: {},
            host: 'localhost',
            port: this.getDefaultPort(options.dialect),
            closeConnectionAutomatically: true
        }, options || {});
        if (!this.options.directory) {
            this.options.noWrite = true;
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let td = yield this.build();
            td = this.relate(td);
            const tt = this.generate(td);
            td.text = tt;
            yield this.write(td);
            return td;
        });
    }
    build() {
        const builder = new auto_builder_1.AutoBuilder(this.sequelize, this.options);
        return builder.build().then(tableData => {
            if (this.options.closeConnectionAutomatically) {
                return this.sequelize.close().then(() => tableData);
            }
            return tableData;
        });
    }
    relate(td) {
        const relater = new auto_relater_1.AutoRelater(this.options);
        return relater.buildRelations(td);
    }
    generate(tableData) {
        const dialect = dialects_1.dialects[this.sequelize.getDialect()];
        const generator = new auto_generator_1.AutoGenerator(tableData, dialect, this.options);
        return generator.generateText();
    }
    write(tableData) {
        const writer = new auto_writer_1.AutoWriter(tableData, this.options);
        return writer.write();
    }
    getDefaultPort(dialect) {
        switch (dialect) {
            case 'mssql':
                return 1433;
            case 'postgres':
                return 5432;
            default:
                return 3306;
        }
    }
}
exports.SequelizeAuto = SequelizeAuto;
module.exports = SequelizeAuto;
module.exports.SequelizeAuto = SequelizeAuto;
module.exports.default = SequelizeAuto;
//# sourceMappingURL=auto.js.map