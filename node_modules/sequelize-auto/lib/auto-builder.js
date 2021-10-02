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
exports.AutoBuilder = void 0;
const lodash_1 = __importDefault(require("lodash"));
const sequelize_1 = require("sequelize");
const dialects_1 = require("./dialects/dialects");
const types_1 = require("./types");
/** Queries the database and builds the tables, foreignKeys, indexes, and hasTriggerTables structures in TableData  */
class AutoBuilder {
    constructor(sequelize, options) {
        this.sequelize = sequelize;
        this.queryInterface = this.sequelize.getQueryInterface();
        this.dialect = dialects_1.dialects[this.sequelize.getDialect()];
        this.includeTables = options.tables;
        this.skipTables = options.skipTables;
        this.schema = options.schema;
        this.views = !!options.views;
        this.tableData = new types_1.TableData();
    }
    build() {
        let prom;
        if (this.dialect.showTablesQuery) {
            const showTablesSql = this.dialect.showTablesQuery(this.schema);
            prom = this.executeQuery(showTablesSql);
        }
        else {
            prom = this.queryInterface.showAllTables();
        }
        if (this.views) {
            // Add views to the list of tables
            prom = prom.then(tr => {
                // in mysql, use database name instead of schema
                const vschema = this.dialect.name === 'mysql' ? this.sequelize.getDatabaseName() : this.schema;
                const showViewsSql = this.dialect.showViewsQuery(vschema);
                return this.executeQuery(showViewsSql).then(tr2 => tr.concat(tr2));
            });
        }
        return prom.then(tr => this.processTables(tr))
            .catch(err => { console.error(err); return this.tableData; });
    }
    processTables(tableResult) {
        // tables is an array of either three things:
        // * objects with two properties table_name and table_schema
        // * objects with two properties tableName and tableSchema
        // * objects with a single name property
        // The first happens for dialects which support schemas (e.g. mssql, postgres).
        // The second happens for dialects which do not support schemas (e.g. sqlite).
        let tables = lodash_1.default.map(tableResult, t => {
            return {
                table_name: t.table_name || t.tableName || t.name || String(t),
                table_schema: t.table_schema || t.tableSchema || t.schema || this.schema || null
            };
        });
        // include/exclude tables
        if (this.includeTables) {
            const optables = mapOptionTables(this.includeTables, this.schema);
            tables = lodash_1.default.intersectionWith(tables, optables, isTableEqual);
        }
        else if (this.skipTables) {
            const skipTables = mapOptionTables(this.skipTables, this.schema);
            tables = lodash_1.default.differenceWith(tables, skipTables, isTableEqual);
        }
        const promises = tables.map(t => {
            return this.mapForeignKeys(t).then(() => this.mapTable(t));
        });
        return Promise.all(promises).then(() => this.tableData);
    }
    mapForeignKeys(table) {
        const tableQname = makeTableQName(table);
        const sql = this.dialect.getForeignKeysQuery(table.table_name, table.table_schema || this.sequelize.getDatabaseName());
        const dialect = this.dialect;
        const foreignKeys = this.tableData.foreignKeys;
        return this.executeQuery(sql).then(res => {
            res.forEach(assignColumnDetails);
        }).catch(err => console.error(err));
        function assignColumnDetails(row, ix, rows) {
            let ref;
            if (dialect.remapForeignKeysRow) {
                ref = dialect.remapForeignKeysRow(table.table_name, row);
            }
            else {
                ref = row;
            }
            if (!lodash_1.default.isEmpty(lodash_1.default.trim(ref.source_column)) && !lodash_1.default.isEmpty(lodash_1.default.trim(ref.target_column))) {
                ref.isForeignKey = true;
                ref.foreignSources = lodash_1.default.pick(ref, ['source_table', 'source_schema', 'target_schema', 'target_table', 'source_column', 'target_column']);
            }
            if (dialect.isUnique && dialect.isUnique(ref, rows)) {
                ref.isUnique = ref.constraint_name || true;
            }
            if (lodash_1.default.isFunction(dialect.isPrimaryKey) && dialect.isPrimaryKey(ref)) {
                ref.isPrimaryKey = true;
            }
            if (dialect.isSerialKey && dialect.isSerialKey(ref)) {
                ref.isSerialKey = true;
            }
            foreignKeys[tableQname] = foreignKeys[tableQname] || {};
            foreignKeys[tableQname][ref.source_column] = lodash_1.default.assign({}, foreignKeys[tableQname][ref.source_column], ref);
        }
    }
    mapTable(table) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fields = yield this.queryInterface.describeTable(table.table_name, table.table_schema);
                this.tableData.tables[makeTableQName(table)] = fields;
                // for postgres array or user-defined types, get element type
                if (this.dialect.showElementTypeQuery && (lodash_1.default.some(fields, { type: "ARRAY" }) || lodash_1.default.some(fields, { type: "USER-DEFINED" }))) {
                    // get the subtype of the fields
                    const stquery = this.dialect.showElementTypeQuery(table.table_name, table.table_schema);
                    const elementTypes = yield this.executeQuery(stquery);
                    // add element type to "elementType" property of field
                    elementTypes.forEach(et => {
                        const fld = fields[et.column_name];
                        if (fld.type === "ARRAY") {
                            fld.elementType = et.element_type;
                            if (et.element_type === "USER-DEFINED" && et.enum_values && !fld.special.length) {
                                fld.elementType = "ENUM";
                                // fromArray is a method defined on Postgres QueryGenerator only
                                fld.special = this.queryInterface.queryGenerator.fromArray(et.enum_values);
                            }
                        }
                        else if (fld.type === "USER-DEFINED") {
                            fld.type = !fld.special.length ? et.udt_name : "ENUM";
                        }
                    });
                    // TODO - in postgres, query geography_columns and geometry_columns for detail type and srid
                    if (elementTypes.some(et => et.udt_name === 'geography') && this.dialect.showGeographyTypeQuery) {
                        const gquery = this.dialect.showGeographyTypeQuery(table.table_name, table.table_schema);
                        const gtypes = yield this.executeQuery(gquery);
                        gtypes.forEach(gt => {
                            const fld = fields[gt.column_name];
                            if (fld.type === 'geography') {
                                fld.elementType = `'${gt.udt_name}', ${gt.data_type}`;
                            }
                        });
                    }
                    if (elementTypes.some(et => et.udt_name === 'geometry') && this.dialect.showGeometryTypeQuery) {
                        const gquery = this.dialect.showGeometryTypeQuery(table.table_name, table.table_schema);
                        const gtypes = yield this.executeQuery(gquery);
                        gtypes.forEach(gt => {
                            const fld = fields[gt.column_name];
                            if (fld.type === 'geometry') {
                                fld.elementType = `'${gt.udt_name}', ${gt.data_type}`;
                            }
                        });
                    }
                }
                // for mssql numeric types, get the precision. QueryInterface.describeTable does not return it
                if (this.dialect.showPrecisionQuery && (lodash_1.default.some(fields, { type: "DECIMAL" }) || lodash_1.default.some(fields, { type: "NUMERIC" }))) {
                    const prequery = this.dialect.showPrecisionQuery(table.table_name, table.table_schema);
                    const columnPrec = yield this.executeQuery(prequery);
                    columnPrec.forEach(cp => {
                        const fld = fields[cp.column_name];
                        if (cp.numeric_precision && (fld.type === 'DECIMAL' || fld.type === 'NUMERIC')) {
                            fld.type = `${fld.type}(${cp.numeric_precision},${cp.numeric_scale})`;
                        }
                    });
                }
                this.tableData.indexes[makeTableQName(table)] = (yield this.queryInterface.showIndex({ tableName: table.table_name, schema: table.table_schema }));
                // if there is no primaryKey, and `id` field exists, then make id the primaryKey (#480)
                if (!lodash_1.default.some(fields, { primaryKey: true })) {
                    const idname = lodash_1.default.keys(fields).find(f => f.toLowerCase() === 'id');
                    const idfield = idname && fields[idname];
                    if (idfield) {
                        idfield.primaryKey = true;
                    }
                }
                const countTriggerSql = this.dialect.countTriggerQuery(table.table_name, table.table_schema || "");
                const triggerResult = yield this.executeQuery(countTriggerSql);
                const triggerCount = triggerResult && triggerResult[0] && triggerResult[0].trigger_count;
                if (triggerCount > 0) {
                    this.tableData.hasTriggerTables[makeTableQName(table)] = true;
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    executeQuery(query) {
        return this.sequelize.query(query, {
            type: sequelize_1.QueryTypes.SELECT,
            raw: true
        });
    }
}
exports.AutoBuilder = AutoBuilder;
// option tables are a list of strings; each string is either
// table name (e.g. "Customer") or schema dot table name (e.g. "dbo.Customer")
function mapOptionTables(arr, defaultSchema) {
    return lodash_1.default.map(arr, (t) => {
        const sp = t.split('.');
        return {
            table_name: sp[sp.length - 1],
            table_schema: sp.length > 1 ? sp[sp.length - 2] : defaultSchema
        };
    });
}
function isTableEqual(a, b) {
    return a.table_name === b.table_name && (!b.table_schema || a.table_schema === b.table_schema);
}
function makeTableQName(table) {
    return [table.table_schema, table.table_name].filter(Boolean).join(".");
}
//# sourceMappingURL=auto-builder.js.map