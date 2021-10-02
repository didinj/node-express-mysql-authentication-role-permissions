import { DialectOptions } from "./dialect-options";
import { Dialect } from "sequelize";
export declare const dialects: {
    [name in Dialect]: DialectOptions;
};
