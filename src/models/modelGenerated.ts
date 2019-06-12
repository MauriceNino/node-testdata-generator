export interface IGeneratedCollection {
    dbName: string,
    collectionName: string,
    documents: IGeneratedDocument[]
}

export interface IGeneratedDocument {
    documentFields: IGeneratedField []
}

export interface IGeneratedField {
    fieldName: string,
    fieldValue: any,
    fieldNeedsQuotations?: boolean,
    fieldIsObject?: boolean,
    fieldIsJsonObject?: boolean,
    fieldIsArray?: boolean,
    unboxElements?: boolean,
    referenceKey?: number,
    referenceTo?: number
}