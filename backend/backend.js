import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import db from './db.js'; 
import complaintRoutes from './complaints.js'; 
import foodrequestRoutes from './foodrequest.js';
import verifyToken from './middleware/verifyToken.js';
import dotenv from 'dotenv';
import lostFoundRoutes from './lostNfound.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import hostel from './models/Hostel.js';
import Warden from './models/Warden.js';
import SupportDept from './models/SupportDept.js';
import Student from './models/Student.js';

import { mkdirSync } from 'fs';
await db();

const app = express();
const jwtSecret = "zxcvasdfgtrewqyhbvcxzfdsahfs";

const __filename = fileURLToPath(import.meta.url);       
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        url: req.url,
        hasAuthHeader: !!req.headers.authorization
    });
    next();
});

app.use('/api',foodrequestRoutes);
app.use('/', complaintRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', lostFoundRoutes);
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
});

const uploadsDir = join(__dirname, 'uploads', 'lostfound');
try {
    mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created successfully');
} catch (err) {
    if (err.code !== 'EEXIST') {
        console.error('Error creating uploads directory:', err);
    }
}

app.post('/createWarden', [
    body('warden_id').notEmpty().withMessage('ID is required'),
    body('w_name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('contact_no').notEmpty().withMessage('Contact number is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }  

    try {
        const { warden_id, w_name, email, password, contact_no } = req.body;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

         const warden = new Warden({
            warden_id,
            w_name,
            email,
            password: hashedPassword,
            contact_no
        });

        await warden.save();

        res.status(200).json({ message: 'User created successfully' });
    } catch (error) {
        console.error("Error inserting user:", error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.post('/createStudent', [
    body('roll_no').notEmpty().withMessage('Roll number is required'),
    body('s_name').notEmpty().withMessage('Name is required'),
    body('dept').notEmpty().withMessage('Department is required'),
    body('batch').isInt().withMessage('Batch must be a valid number'),
    body('contact_no').notEmpty().withMessage('Contact number is required'),
    body('snu_email_id').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('room_no').notEmpty().withMessage('Room number is required'),
    body('hostel_id').notEmpty().withMessage('Hostel ID is required'),
    body('parent_contact').notEmpty().withMessage('Parent contact is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { roll_no, s_name, dept, batch, contact_no, snu_email_id, password, room_no, hostel_id, parent_contact } = req.body;

        // Check hostel existence and capacity
        const hostel = await Hostel.findOne({ hostel_id });
        if (!hostel) {
            return res.status(400).json({ message: 'This hostel does not exist' });
        }
        const current_occupancy = await Student.countDocuments({ hostel_id });
        if (current_occupancy >= hostel.capacity) {
            return res.status(400).json({ message: 'This hostel is full' });
        }

        // Check for existing email
        const existingEmail = await Student.findOne({ snu_email_id });
        if (existingEmail) {
            return res.status(400).json({ message: 'This email is already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const student = new Student({
            roll_no,
            s_name,
            dept,
            batch,
            contact_no,
            snu_email_id,
            password: hashedPassword,
            room_no,
            hostel_id,
            parent_contact
        });

        await student.save();

        res.status(200).json({ message: 'Student created successfully' });
    } catch (error) {
        console.error("Error inserting student:", error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.post('/createHostel', [
    body('hostel_id').notEmpty().withMessage('Hostel ID is required'),
    body('h_name').notEmpty().withMessage('Hostel name is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
    body('warden_id').optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { hostel_id, h_name, capacity, warden_id } = req.body;

        // Check for existing hostel
        const existingHostel = await Hostel.findOne({ hostel_id });
        if (existingHostel) {
            return res.status(400).json({ message: 'Hostel already exists' });
        }

        // If warden_id is provided, check existence
        if (warden_id) {
            const warden = await Warden.findOne({ warden_id });
            if (!warden) {
                return res.status(400).json({ message: 'The specified warden does not exist' });
            }
        }

        const hostel = new Hostel({
            hostel_id,
            h_name,
            capacity,
            warden_id: warden_id || null
        });

        await hostel.save();

        res.status(201).json({
            message: 'Hostel created successfully',
            hostel: {
                hostel_id, h_name, capacity, warden_id: warden_id || null
            }
        });
    } catch (error) {
        console.log("Error creating the hostel:", error);
        res.status(500).json({ message: 'Failed to create a hostel', error: error.message });
    }
});

app.post('/createSupportAdmin', [
    body('D_Name')
        .isIn(['Maintenance', 'Pest-control', 'Housekeeping', 'IT'])
        .withMessage('Department Name must be one of: Maintenance, Pest-control, Housekeeping, IT'),
    body('warden_id').optional(),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('staff_capacity').isInt({ min: 1 }).withMessage('Staff capacity must be a positive number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { D_Name, warden_id, email, password, staff_capacity } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const supportAdmin = new SupportDept({
            D_Name,
            warden_id: warden_id || null,
            email,
            password: hashedPassword,
            staff_capacity
        });

        await supportAdmin.save();

        res.status(201).json({ message: 'Support Admin created successfully' });
    } catch (error) {
        console.error("Error inserting Support Admin:", error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Warden Login
app.post('/loginWarden', async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const warden = await Warden.findOne({ email });
        if (!warden) {
            return res.status(400).json({ message: 'Try logging in with correct credentials' });
        }

        const pwdCompare = await bcrypt.compare(password, warden.password);
        if (!pwdCompare) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ warden_id: warden.warden_id }, jwtSecret, { expiresIn: '1h' });
        res.json({ success: true, token });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


app.post('/loginStudent', async (req, res) => {
    const { snu_email_id, password } = req.body;

    if (!snu_email_id || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        console.log('Login attempt:', { snu_email_id, password });
        const student = await Student.findOne({ snu_email_id });
        console.log('Student found:', student);

        if (!student) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const pwdCompare = await bcrypt.compare(password, student.password);
        console.log('Password match:', pwdCompare);

        if (!pwdCompare) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { roll_no: student.roll_no },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.json({
            success: true,
            token,
            userData: {
                roll_no: student.roll_no,
                name: student.s_name
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Support Admin Login
app.post('/loginSupportAdmin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await SupportDept.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: "Email not found" });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = jwt.sign(
            { d_name: admin.D_Name },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: "Login successful",
            token
        });
    } catch (err) {
        console.error("Support login error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Student Profile (with hostel name)
import Hostel from './models/Hostel.js';

app.get('/student/profile', verifyToken, async (req, res) => {
    try {
        const roll_no = req.roll_no;
        console.log('Fetching profile for:', roll_no);

        const student = await Student.findOne({ roll_no });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        let hostelName = null;
        if (student.hostel_id) {
            const hostel = await Hostel.findOne({ hostel_id: student.hostel_id });
            hostelName = hostel ? hostel.h_name : null;
        }

        res.json({
            roll_no: student.roll_no,
            s_name: student.s_name,
            dept: student.dept,
            batch: student.batch,
            contact_no: student.contact_no,
            snu_email_id: student.snu_email_id,
            room_no: student.room_no,
            hostel_id: student.hostel_id,
            parent_contact: student.parent_contact,
            h_name: hostelName
        });
    } catch (err) {
        console.error('Error fetching student profile:', err);
        res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
    }
});

app.use(complaintRoutes); 

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
