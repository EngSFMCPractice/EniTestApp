const { Pool } = require('pg');

let env = process.env;

const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

/*
exports.getTokenByJourneyID = async (JourneyID) => {
    try {
        const query = `SELECT "Token", "Expire" FROM "TokensLog" WHERE "JourneyID" = $1`;
        const res = await pool.query(query, [JourneyID]);
        return res.rows; 
    } catch (e) {
        console.error('Error: ' + e);
        return [];
    }
}
*/

exports.insertLogHistory = async (data) => {
    try {
        const res = await pool.query(`INSERT INTO "PushHistoryLog" ("SubscriberKey", "JourneyID", "ActivityID", "ActivityObjectID", "Msg_ID", "Status", "Error_message") 
                                        VALUES($1, $2, $3, $4, $5, $6, $7)`, [data.SubscriberKey, data.JourneyId, data.ActivityId, data.ActivityObjectID, data.Msg_ID, data.Status, data.Error_Message]);

        return res.rowCount; 
    } catch (e) {
        console.error('Error: ' + e);
        return 0;
    }
};

exports.getLogHistory = async () => {
    try {

        const { rows } = await pool.query(`
        SELECT * 
        FROM "PushHistoryLog" 
        WHERE DATE("Log_date") = CURRENT_DATE - 1
        `);

        if(rows.length > 0){
            const rowToImport = rows.map(row => ({
                SubscriberKey: row.SubscriberKey,
                JourneyId: row.JourneyID,
                ActivityId: row.ActivityID,
                ActivityObjectID: row.ActivityObjectID,
                Msg_ID: row.Msg_ID,
                Status: row.Status,
                Error_Message: row.Error_message,
                Log_date: row.Log_date,
              }));
            
            return rowToImport;

        }else{
            return [];
        }

    } catch (e) {
        console.error('Error: ' + e);
        return [];
    }
};

/*
exports.updateToken = async (data) => {
    try {
        const query = `
            UPDATE "TokensLog"
            SET "Token" = $1, "Expire" = $2
            WHERE "JourneyID" = $3`;
        const res = await pool.query(query, [data.Token, data.Expire, data.JourneyID]);
        return res.rowCount;
    } catch (e) {
        console.error('Error:', e);
        return 0;
    }
};
*/