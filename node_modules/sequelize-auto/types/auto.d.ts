import { Dialect, Sequelize } from "sequelize";
import { AutoOptions, TableData } from "./types";
export declare class SequelizeAuto {
    sequelize: Sequelize;
    options: AutoOptions;
    constructor(database: string | Sequelize, username: string, password: string, options: AutoOptions);
    run(): Promise<TableData>;
    build(): Promise<TableData>;
    relate(td: TableData): TableData;
    generate(tableData: TableData): {
        [name: string]: string;
    };
    write(tableData: TableData): Promise<void> | Promise<void[]>;
    getDefaultPort(dialect?: Dialect): 1433 | 5432 | 3306;
}
