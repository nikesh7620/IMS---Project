const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function createEmployee() {
    try {
        const empCode = 'EMP001';
        const firstName = 'Nikesh';
        const lastName = 'Admin';
        const email = 'nikesh@example.com';
        const password = 'Admin@123';
        const role = 'ADMIN';

        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO employees
                (emp_code, first_name, last_name, email, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING employee_id, emp_code, email, role`,
            [empCode, firstName, lastName, email, passwordHash, role]
        );

        console.log('Employee created successfully:');
        console.log(result.rows[0]);

    } catch (error) {
        console.error('Employee creation failed:', error.message);
    } finally {
        await pool.end();
    }
}

createEmployee();