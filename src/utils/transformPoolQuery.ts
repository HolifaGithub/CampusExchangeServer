import pool from '../pool'

interface Result {
    affectedRows: number;
}

function transformPoolQuery(sql: string, args: any[]) {
    return new Promise<any>((resolve, reject) => {
        pool.query(sql, args, (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    })
}

export default transformPoolQuery