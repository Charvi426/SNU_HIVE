console.log("🔥🔥🔥 BACKEND.JS WITH GOOGLE OAUTH FIX 🔥🔥🔥");

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import db from './db.js'; 
import complaintRoutes from './complaints.js'; 
import foodrequestRoutes from './foodrequest.js';
import verifyToken from './middleware/verifyToken.js';
import verifyWardenToken from './middleware/verifyWardenToken.js';
import dotenv from 'dotenv';
import lostFoundRoutes from './lostNfound.js';
import carpoolRoutes from './carpool.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parse } from 'csv-parse/sync';
import { upload } from './config/cloudinary.js';

import Hostel from './models/Hostel.js';
import Warden from './models/Warden.js';
import SupportDept from './models/SupportDept.js';
import Student from './models/Student.js';

dotenv.config();

import "./middleware/passport.js";
import passport from "passport";

import { mkdirSync } from 'fs';
await db();

const app = express();

app.get("/", (req, res) => {
  res.send("ROOT BACKEND HIT");
});


app.use(passport.initialize());
const jwtSecret = process.env.JWT_SECRET;

const __filename = fileURLToPath(import.meta.url);       
const __dirname = dirname(__filename);

const allowedOrigins = [
  'https://snu-hivefrontend.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    // Also allow Google OAuth redirects
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
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

app.get("/auth/ping", (req, res) => {
  res.send("AUTH ROUTES LIVE");
});

app.get("/auth/debug", (req, res) => {
  res.json({
    googleConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    frontendUrl: process.env.FRONTEND_URL,
    jwtConfigured: !!process.env.JWT_SECRET
  });
});

app.get(
  "/auth/google",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: "Google OAuth not configured",
        message: "Google authentication is not available. Please contact administrator."
      });
    }
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account",
    })(req, res, next);
  }
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, async (err, user, info) => {
      if (err) {
        console.error("Google OAuth Error:", err);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login/student?error=${encodeURIComponent("Authentication failed")}`
        );
      }

      if (!user) {
        console.log("Google OAuth: No matching student record", info);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login/student?error=${encodeURIComponent("This email was not found in hostel records. Please contact your warden.")}`
        );
      }

      // User exists - create token and redirect
      console.log("Google OAuth: matched student", user.roll_no, user.snu_email_id);
      const token = jwt.sign(
        { roll_no: user.roll_no, role: "student" },
        jwtSecret,
        { expiresIn: "1d" }
      );

      const redirectUrl = `${process.env.FRONTEND_URL}/oauth-success?token=${token}&role=student`;
      console.log("Google OAuth: redirecting to", redirectUrl);
      res.redirect(redirectUrl);
    })(req, res, next);
  }
);

app.use('/api',foodrequestRoutes);
app.use('/', complaintRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', lostFoundRoutes);
app.use('/api', carpoolRoutes);

// Error handling middleware for multer and other errors
app.use((err, req, res, next) => {
    console.error('Middleware Error:', {
        message: err.message,
        code: err.code,
        name: err.name,
        url: req.url,
        method: req.method
    });
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large' });
    }
    if (err.code === 'LIMIT_PART_COUNT') {
        return res.status(400).json({ message: 'Too many parts' });
    }
    if (err.code === 'LIMIT_FIELD_NAME_SIZE' || err.code === 'LIMIT_FIELD_SIZE') {
        return res.status(400).json({ message: 'Field too large' });
    }
    
    res.status(500).json({ 
        message: 'Server error',
        error: err.message
    });
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

        res.status(200).json({
        success: true,
        message: 'warden created successfully'
        });
        
    } catch (error) {
        console.error("Error inserting user:", error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Student signup: claims a pre-registered record (uploaded by the warden via CSV)
// by setting a password. Students never provide roll_no/dept/hostel/etc themselves.
app.post('/createStudent', [
    body('snu_email_id').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const snu_email_id = req.body.snu_email_id.trim().toLowerCase();
        const { password } = req.body;

        const student = await Student.findOne({ snu_email_id });
        if (!student) {
            return res.status(404).json({
                message: 'This email was not found in hostel records. Please contact your warden.'
            });
        }

        if (student.isRegistered) {
            return res.status(400).json({ message: 'This email is already registered. Please log in instead.' });
        }

        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(password, salt);
        student.isRegistered = true;
        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student account activated successfully'
        });
    } catch (error) {
        console.error("Error activating student:", error.message, error.stack);
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

// Bulk create/update student records from a warden-provided CSV.
// Students never submit roll_no/dept/hostel/etc themselves - only /createStudent (setting a password) does.
app.post('/api/warden/students/upload', verifyWardenToken, upload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'CSV file is required (field name: csvFile)' });
    }

    let rows;
    try {
        rows = parse(req.file.buffer.toString('utf-8'), {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
    } catch (err) {
        return res.status(400).json({ message: 'Could not parse CSV file', error: err.message });
    }

    const requiredColumns = ['roll_no', 's_name', 'snu_email_id', 'dept', 'batch', 'contact_no', 'parent_contact', 'room_no', 'hostel_id'];
    const results = { created: 0, updated: 0, failed: [] };

    for (const [index, row] of rows.entries()) {
        const rowNum = index + 2; // +1 for header row, +1 for 1-indexing
        const missing = requiredColumns.filter(col => !row[col]);
        if (missing.length > 0) {
            results.failed.push({ row: rowNum, error: `Missing: ${missing.join(', ')}` });
            continue;
        }

        try {
            const roll_no = row.roll_no.trim();
            const snu_email_id = row.snu_email_id.trim().toLowerCase();
            const contact_no = row.contact_no.trim();
            const batch = parseInt(row.batch, 10);
            const hostel_id = row.hostel_id.trim();

            if (isNaN(batch)) {
                results.failed.push({ row: rowNum, error: 'batch must be a number' });
                continue;
            }

            const hostel = await Hostel.findOne({ hostel_id });
            if (!hostel) {
                results.failed.push({ row: rowNum, error: `Hostel '${hostel_id}' does not exist` });
                continue;
            }

            const emailConflict = await Student.findOne({ snu_email_id, roll_no: { $ne: roll_no } });
            if (emailConflict) {
                results.failed.push({ row: rowNum, error: `Email already used by a different student (${emailConflict.roll_no})` });
                continue;
            }

            const contactConflict = await Student.findOne({ contact_no, roll_no: { $ne: roll_no } });
            if (contactConflict) {
                results.failed.push({ row: rowNum, error: `Contact number already used by a different student (${contactConflict.roll_no})` });
                continue;
            }

            const update = {
                s_name: row.s_name.trim(),
                dept: row.dept.trim(),
                batch,
                contact_no,
                snu_email_id,
                room_no: row.room_no.trim(),
                hostel_id,
                parent_contact: row.parent_contact.trim()
            };

            const existing = await Student.findOne({ roll_no });
            if (existing) {
                await Student.updateOne({ roll_no }, { $set: update });
                results.updated++;
            } else {
                await Student.create({ roll_no, ...update, isRegistered: false });
                results.created++;
            }
        } catch (err) {
            results.failed.push({ row: rowNum, error: err.message });
        }
    }

    res.status(200).json({ success: true, ...results });
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
        res.status(200).json({
        success: true,
        message: 'Student created successfully'
        });
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
        const student = await Student.findOne({ snu_email_id });

        if (!student || !student.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const pwdCompare = await bcrypt.compare(password, student.password);

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

app.get('/api/student/profile', verifyToken, async (req, res) => {
    try {
        const roll_no = req.user?.roll_no;
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

// 404 handler - catch all unmatched routes
app.use((req, res) => {
    console.error('404 - Route not found:', {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl
    });
    res.status(404).json({ 
        message: 'Route not found',
        method: req.method,
        url: req.url
    });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
