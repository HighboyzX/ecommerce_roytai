const Prisma = require('../config/prisma');
const Bcrypt = require('bcryptjs');
const Jwt = require('jsonwebtoken');

class User {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }

    validateInput() {
        if (!this.email || typeof this.email !== 'string' || !this.email.trim()) {
            return 'Invalid email format!';
        }
        if (!this.password) {
            return 'Password is required!';
        }
        if (this.password.length < 4) {
            return 'Password must be at least 4 characters long!';
        }
        return null;
    }


    async fetchUser() {
        try {
            return await Prisma.user.findUnique({
                where: {
                    email: this.email
                }
            });
        } catch (err) {
            console.error('Error fetching usert:', err);
            throw err;
        }
    }
}

const generateToken = (payload) => {
    return Jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' });
}

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;
        const _user = new User(email, password);

        // Validate input
        const validationError = _user.validateInput();
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        // Check if user already exists
        const existingUser = await _user.fetchUser();

        if (existingUser) {
            return res.status(400).json({ message: 'Email already exits!' });
        }

        const hashPassword = await Bcrypt.hash(password, 10);

        // Create new user
        await Prisma.user.create({
            data: {
                email: email,
                password: hashPassword

            }
        });

        res.status(201).json({ message: 'Register success!' });
    } catch (err) {
        console.error('Error during user registration:', err.message);
        res.status(500).json({ message: "Server error" });
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const _user = new User(email, password);

        // Validate input
        const validationError = _user.validateInput();
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        // Find user by email
        const user = await _user.fetchUser();
        if (!user || !user.enabled) {
            return res.status(400).json({ message: 'User not found or not enabled!' })
        }

        // Verify password
        const isPasswordValid = await Bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid password!' });
        }

        // Create JWT payload
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };


        // Generate JWT token
        const token = generateToken(payload);

        // Respond with token and user info
        res.status(200).json({
            user: payload,
            token
        })

    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ message: "Server error" });
    }
}

exports.currentUser = (req, res) => {

    try {
        res.send('Hello current user in Controller');
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server error" });
    }
}