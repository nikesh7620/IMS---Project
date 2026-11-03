const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        if (!employeeId || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Employee ID and password are required.'
            });
        }

        const result = await pool.query(
            `SELECT employee_id, emp_code, first_name,
                    last_name, email, password_hash, role, is_active
             FROM employees
             WHERE emp_code = $1`,
            [employeeId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid Employee ID or password.'
            });
        }

        const employee = result.rows[0];

        if (!employee.is_active) {
            return res.status(403).json({
                status: 'error',
                message: 'Your account is inactive.'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            employee.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid Employee ID or password.'
            });
        }

        const token = jwt.sign(
            {
                employeeId: employee.employee_id,
                empCode: employee.emp_code,
                role: employee.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        return res.status(200).json({
            status: 'success',
            message: 'Login successful.',
            token,
            employee: {
                employeeId: employee.employee_id,
                empCode: employee.emp_code,
                firstName: employee.first_name,
                lastName: employee.last_name,
                email: employee.email,
                role: employee.role
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

module.exports = { login };