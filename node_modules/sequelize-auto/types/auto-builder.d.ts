import { QueryInterface, Sequelize } from "sequelize";
import { AutoOptions } from ".";
import { DialectOptions } from "./dialects/dialect-options";
import { TableData } from "./types";
/** Queries the database and builds the tables, foreignKeys, indexes, and hasTriggerTables structures in TableData  */
export declare class AutoBuilder {
    sequelize: Sequelize;
    queryInterface: QueryInterface;
    dialect: DialectOptions;
    includeTables?: string[];
    skipTables?: string[];
    schema?: string;
    views: boolean;
    tableData: TableData;
    constructor(sequelize: Sequelize, options: AutoOptions);
    build(): Promise<TableData>;
    private processTables;
    private mapForeignKeys;
    private mapTable;
    private executeQuery;
}
