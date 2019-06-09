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
    fieldNeedsQuotations?: boolean,
    fieldIsObject?: boolean,
    fieldIsArray?: boolean,
    fieldValue: any

    //TODO: Unbox array object field. When this is checked, the array needs to consist of objects with a single property which it can unbox
}