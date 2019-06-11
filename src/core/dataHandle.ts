import sqlite3 from "sqlite3";

export class DataHandle {
    public db: sqlite3.Database;

    private hasNextCalled: boolean = false;
    private hasNextString: string = "";
    
    public getNext(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if(this.hasNextCalled) {
                this.hasNextCalled = false;
                resolve(this.hasNextString);
            }
            this.db.get("SELECT rowid as id, value FROM temp_out ORDER BY ROWID ASC LIMIT 1", (err, row) => {
                if(err != undefined || row == undefined) {
                    reject();
                }
                else {
                    this.deleteRow(row.id);
                    resolve(row.value);
                }
            });
        });
    }

    public hasNext(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this.db.get("SELECT rowid as id, value FROM temp_out ORDER BY ROWID ASC LIMIT 1", (err, row) => {
                if(err != undefined) reject();

                if(row == undefined) {
                    resolve(false);
                } else {
                    this.hasNextCalled = true;
                    this.hasNextString = row.value;
                    this.deleteRow(row.id);
                    resolve(true);
                }
            });
        });
    }

    private deleteRow(rowId: number) {
        var stmt = this.db.prepare("DELETE FROM temp_out WHERE rowid = $id");
        stmt.run({ $id: rowId });
        stmt.finalize();
    }
}