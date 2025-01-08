import sql from 'mssql';

const sqlConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DATABASE,
  server: process.env.MSSQL_SERVER,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: false, // 如果是使用 Windows Azure，設為 true
    trustServerCertificate: true // 開發環境可以設為 true
  }
};

// 建立連線池
let pool;

export async function initializeMssqlPool() {
  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log('Connected to MSSQL');
    return pool;
  } catch (err) {
    console.error('Failed to connect to MSSQL:', err);
    throw err;
  }
}

export async function getMssqlPool() {
  if (!pool) {
    await initializeMssqlPool();
  }
  return pool;
}

export async function getMssqlData(query, params = []) {
  try {
    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    
    // 添加參數
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('MSSQL Error:', error);
    throw error;
  }
}