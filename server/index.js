import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mysql from 'mysql2/promise';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bcrypt from 'bcryptjs';
import reportRoutes from './routes/reports.js';
import targetTimesRoutes from './routes/targetTimes.js';
import dashboardRoutes from './routes/dashboard.js';
import transactionRoutes from './routes/transactions.js';
import cashHistoryRoutes from './routes/cash-history.js';
import freelancerRoutes from './routes/freelancer.js';
import upworkRoutes from './routes/upwork.js';
import bidRoutes from './routes/bids.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));

// Database connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Update freelancer_bids table
const updateFreelancerBidsTable = `
  ALTER TABLE freelancer_bids 
  ADD COLUMN IF NOT EXISTS status ENUM('sent', 'chat', 'offer', 'client_view', 'no_view', 'reject') NOT NULL DEFAULT 'sent'
`;

// Update upwork_bids table
const updateUpworkBidsTable = `
  ALTER TABLE upwork_bids 
  MODIFY COLUMN status ENUM('sent', 'chat', 'offer', 'client_view', 'no_view', 'reject') NOT NULL DEFAULT 'sent'
`;

// Initialize database
const initDb = async () => {
  try {
    // Create database if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.end();

    // Create users table with role column and target_money
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        target_money DECIMAL(10,2) DEFAULT 3000.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createTableQuery);

    const createCashHistoryTableQuery = `
      CREATE TABLE IF NOT EXISTS cash_history (
      id SERIAL PRIMARY KEY,
      amount DECIMAL(10,2) NOT NULL,
      reason TEXT NOT NULL,
      date DATE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ); 
    `;

    await pool.query(createCashHistoryTableQuery);

    // Create work reports table
    const createReportsTable = `
      CREATE TABLE IF NOT EXISTS work_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        report_date DATE NOT NULL,
        working_hours DECIMAL(4,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, report_date)
      )
    `;

    await pool.query(createReportsTable);

    // Create target working times table
    const createTargetTimesTable = `
      CREATE TABLE IF NOT EXISTS target_working_times (
        id INT AUTO_INCREMENT PRIMARY KEY,
        weekday_target DECIMAL(4,2) DEFAULT 16.00,
        weekend_target DECIMAL(4,2) DEFAULT 8.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `;

    await pool.query(createTargetTimesTable);

    // Create transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_country VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_type VARCHAR(50) NOT NULL,
        transaction_date DATETIME NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createTransactionsTable);

    // Create bids table
    const createFreelancerBidsTable = `
      CREATE TABLE IF NOT EXISTS freelancer_bids (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        skill VARCHAR(255) NOT NULL,
        bid_number INT NOT NULL,
        bid_date DATE NOT NULL DEFAULT CURRENT_DATE,
        status ENUM('sent', 'chat', 'offer') NOT NULL DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    await pool.query(createFreelancerBidsTable);
    
    // Create chats table
    const createFreelancerChatsTable = `
      CREATE TABLE IF NOT EXISTS freelancer_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_country VARCHAR(255) NOT NULL,
        project_title VARCHAR(255) NOT NULL,
        review DECIMAL(3,1) NOT NULL DEFAULT 0,
        review_number INT NOT NULL DEFAULT 0,
        spent_money DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_awarded BOOLEAN NOT NULL DEFAULT false,
        chat_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    await pool.query(createFreelancerChatsTable);
    
    // Create upwork bids table
    const createUpworkBidsTable = `
      CREATE TABLE IF NOT EXISTS upwork_bids (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        bid_date DATE NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        country VARCHAR(2) NOT NULL,
        total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
        average_hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
        spent_bid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        account_name VARCHAR(255) NOT NULL,
        status ENUM('chat', 'offer', 'client_view', 'no_view', 'reject') NOT NULL DEFAULT 'no_view',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    await pool.query(createUpworkBidsTable);
    
    // Insert default target times if not exists
    const [existingTargets] = await pool.query('SELECT * FROM target_working_times');
    if (existingTargets.length === 0) {
      await pool.query(
        'INSERT INTO target_working_times (weekday_target, weekend_target) VALUES (?, ?)',
        [16.00, 8.00]
      );
    }

    // Check if admin exists, if not create default admin
    const [admins] = await pool.query("SELECT * FROM users WHERE role = 'admin'");

    if (admins.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await pool.query(
        'INSERT INTO users (name, email, password, role, target_money) VALUES (?, ?, ?, ?, ?)',
        ['Admin', 'admin@example.com', hashedPassword, 'admin', 3000.00]
      );

      console.log('Default admin created with email: admin@example.com and password: admin123');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/target-times', targetTimesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cash-history', cashHistoryRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/upwork', upworkRoutes);
app.use('/api/bids', bidRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 5000;

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});