import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// MySQL Connection Configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'erfaq_db',
  port: Number(process.env.MYSQL_PORT) || 3306
};

let pool;

async function initMySQL() {
  try {
    // Connect to MySQL server
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    pool = mysql.createPool({ ...dbConfig, waitForConnections: true, connectionLimit: 10 });

    // Create Tables if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        empId VARCHAR(100),
        name VARCHAR(255),
        civilId VARCHAR(100),
        jobTitle VARCHAR(255),
        department VARCHAR(255),
        startDate VARCHAR(50),
        endDate VARCHAR(50),
        defaultSalary DECIMAL(12, 2),
        notes TEXT,
        createdAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contracts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT,
        contractNumber VARCHAR(100),
        startDate VARCHAR(50),
        endDate VARCHAR(50),
        value DECIMAL(12, 2),
        notes TEXT,
        status VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS salaries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT,
        yearMonth VARCHAR(20),
        basicSalary DECIMAL(12, 2),
        carAllowance DECIMAL(12, 2),
        phoneAllowance DECIMAL(12, 2),
        bonusesOrOvertime DECIMAL(12, 2),
        allowances DECIMAL(12, 2),
        deductions DECIMAL(12, 2),
        netSalary DECIMAL(12, 2),
        isPaidLeave TINYINT(1) DEFAULT 0,
        paidLeaveType VARCHAR(100),
        paidLeaveDays INT DEFAULT 0,
        notes TEXT,
        status VARCHAR(50),
        updatedAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bonuses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT,
        type VARCHAR(255),
        amount DECIMAL(12, 2),
        month VARCHAR(50),
        notes TEXT,
        status VARCHAR(50),
        createdAt VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT,
        leaveType VARCHAR(255),
        startDate VARCHAR(50),
        endDate VARCHAR(50),
        daysCount INT,
        notes TEXT,
        status VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employeeId INT,
        category VARCHAR(50),
        refId INT,
        fileName VARCHAR(255),
        fileType VARCHAR(100),
        fileSize BIGINT,
        fileData LONGTEXT,
        highlightBox LONGTEXT,
        uploadDate VARCHAR(100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ MySQL Database initialized successfully and tables ready!');
  } catch (err) {
    console.warn('⚠️ MySQL Connection info: falling back to JSON db storage if MySQL is starting up.', err.message);
  }
}

initMySQL();

// JSON file fallback storage
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readFallbackDb() {
  if (!fs.existsSync(DB_FILE)) return { employees: [], contracts: [], salaries: [], bonuses: [], otherPayments: [], leaves: [], attachments: [] };
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (e) { return { employees: [], contracts: [], salaries: [], bonuses: [], otherPayments: [], leaves: [], attachments: [] }; }
}
function writeFallbackDb(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }

// GET entire DB from MySQL
app.get('/api/db', async (req, res) => {
  if (pool) {
    try {
      const [employees] = await pool.query('SELECT * FROM employees');
      const [contracts] = await pool.query('SELECT * FROM contracts');
      const [salaries] = await pool.query('SELECT * FROM salaries');
      const [bonuses] = await pool.query('SELECT * FROM bonuses');
      const [leaves] = await pool.query('SELECT * FROM leaves');
      const [attachmentsRaw] = await pool.query('SELECT * FROM attachments');

      const attachments = attachmentsRaw.map(att => ({
        ...att,
        highlightBox: att.highlightBox ? JSON.parse(att.highlightBox) : null
      }));

      return res.json({
        employees, contracts, salaries, bonuses, otherPayments: [], leaves, attachments
      });
    } catch (err) {
      console.error('MySQL query error:', err.message);
    }
  }

  res.json(readFallbackDb());
});

// POST Save / Replace entire DB to MySQL
app.post('/api/db', async (req, res) => {
  const { employees, contracts, salaries, bonuses, leaves, attachments } = req.body || {};

  if (pool) {
    try {
      if (employees && employees.length) {
        await pool.query('DELETE FROM employees');
        for (const e of employees) {
          await pool.query(
            'INSERT INTO employees (id, empId, name, civilId, jobTitle, department, startDate, endDate, defaultSalary, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [e.id, e.empId || '', e.name || '', e.civilId || '', e.jobTitle || '', e.department || '', e.startDate || '', e.endDate || '', e.defaultSalary || 0, e.notes || '', e.createdAt || '']
          );
        }
      }

      if (salaries && salaries.length) {
        await pool.query('DELETE FROM salaries');
        for (const s of salaries) {
          await pool.query(
            'INSERT INTO salaries (id, employeeId, yearMonth, basicSalary, carAllowance, phoneAllowance, bonusesOrOvertime, allowances, deductions, netSalary, isPaidLeave, paidLeaveType, paidLeaveDays, notes, status, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [s.id, s.employeeId, s.yearMonth, s.basicSalary || 0, s.carAllowance || 0, s.phoneAllowance || 0, s.bonusesOrOvertime || 0, s.allowances || 0, s.deductions || 0, s.netSalary || 0, s.isPaidLeave ? 1 : 0, s.paidLeaveType || '', s.paidLeaveDays || 0, s.notes || '', s.status || 'missing', s.updatedAt || '']
          );
        }
      }

      if (attachments && attachments.length) {
        await pool.query('DELETE FROM attachments');
        for (const a of attachments) {
          const hbStr = a.highlightBox ? JSON.stringify(a.highlightBox) : null;
          await pool.query(
            'INSERT INTO attachments (id, employeeId, category, refId, fileName, fileType, fileSize, fileData, highlightBox, uploadDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [a.id, a.employeeId, a.category || 'salary', a.refId, a.fileName || '', a.fileType || '', a.fileSize || 0, a.fileData || '', hbStr, a.uploadDate || '']
          );
        }
      }

      writeFallbackDb(req.body);
      return res.json({ success: true, message: 'MySQL Database updated successfully' });
    } catch (err) {
      console.error('MySQL Save Error:', err.message);
    }
  }

  writeFallbackDb(req.body);
  res.json({ success: true, message: 'Fallback JSON DB saved' });
});

app.listen(PORT, () => {
  console.log(`🚀 MySQL Server API listening on port ${PORT}`);
});
