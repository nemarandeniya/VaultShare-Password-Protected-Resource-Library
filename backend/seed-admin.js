import pool from './db.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();


const createAdmin = async () => {
    const hashed = await bcrypt.hash('admin123', 10);
    await pool.query(`INSERT INTO users (userId, username, password,created_at)
    VALUES (?,?,?,NOW())`,
        ["ADMIN001", "Admin", hashed]);
    console.log('Admin created successfully');
}
createAdmin()

// cd "D:\programing\Project\Third Shift Media\ClientPortal\backend\src"
// node seed-admin.js