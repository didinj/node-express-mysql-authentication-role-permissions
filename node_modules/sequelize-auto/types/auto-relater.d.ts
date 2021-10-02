import { AutoOptions } from ".";
import { CaseOption, Relation, TableData } from "./types";
/** Constructs entity relationships from TableData.foreignKeys and populates TableData.relations */
export declare class AutoRelater {
    caseModel: CaseOption;
    caseProp: CaseOption;
    singularize: boolean;
    relations: Relation[];
    private usedChildNames;
    constructor(options: AutoOptions);
    /** Create Relations from the foreign keys, and add to TableData */
    buildRelations(td: TableData): TableData;
    /** Create a Relation object for the given foreign key */
    private addRelation;
    /** Convert foreign key name into alias name for belongsTo relations */
    private getAlias;
    /** Convert foreign key name into alias name for hasMany/hasOne relations */
    private getChildAlias;
    private trimId;
}
