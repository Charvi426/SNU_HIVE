import express from 'express';
import { body, validationResult } from 'express-validator';
import db from './db.js';
import verifyToken from './middleware/verifyToken.js';
import verifyWardenToken from './middleware/verifyWardenToken.js';


const router = express.Router();


router.get('/test', (req, res) => {
    res.json({ message: 'Food request routes working' });
});


router.post('/foodrequest', verifyToken, [
    body('food_id')
        .matches(/^\d{4}$/)
        .withMessage('Food ID must be exactly 4 digits'),
    body('type')
        .isIn(['Breakfast', 'Lunch', 'Dinner'])
        .withMessage('Type must be Breakfast, Lunch or Dinner'),
    body('date')
        .isDate()
        .withMessage('Invalid date format')
        .custom(value => {
            const requestDate = new Date(value);
            const today = new Date();
            return requestDate >= today;
        })
        .withMessage('Cannot request for past dates')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { food_id, type, date } = req.body;
        const roll_no = req.roll_no;

        const [student] = await db.execute(
            'SELECT hostel_id FROM student WHERE roll_no = ?',
            [roll_no]
        );

        if (!student[0]?.hostel_id) {
            return res.status(400).json({ message: 'Student not assigned to any hostel' });
        }

        await db.execute(
            `INSERT INTO food_request (food_id, roll_no, hostel_id, type, date, status)
             VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [food_id, roll_no, student[0].hostel_id, type, date]
        );

        res.status(201).json({
            message: 'Food request created successfully',
            request: {
                food_id,
                type,
                date,
                status: 'Pending'
            }
        });
    } catch (error) {
        console.error('Error creating food request:', error);
        res.status(500).json({ message: 'Failed to create food request' });
    }
});

router.get('/foodrequest/student', verifyToken, async (req, res) => {
    try {
        const roll_no = req.roll_no;
        console.log('Fetching food requests for roll_no:', roll_no);

        if (!roll_no) {
            return res.status(401).json({ message: 'No student roll number found in token' });
        }

        const [rows] = await db.execute(`
            SELECT fr.*, s.s_name, h.h_name
            FROM food_request fr
            JOIN student s ON fr.roll_no = s.roll_no
            JOIN hostel h ON s.hostel_id = h.hostel_id
            WHERE fr.roll_no = ?
            ORDER BY fr.date DESC
        `, [roll_no]);

        console.log(`Found ${rows.length} food requests`);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching food requests:", err);
        res.status(500).json({ 
            message: "Failed to fetch food requests", 
            error: err.message 
        });
    }
});

router.use((req, res, next) => {
    console.log('Food request route accessed:', {
        method: req.method,
        path: req.path,
        hasToken: !!req.headers.authorization
    });
    next();
});

router.get('/foodrequests', verifyWardenToken, async (req, res) => {
    try {
        console.log('Warden ID from token:', req.warden?.warden_id);
        
        const warden_id = req.warden?.warden_id;
        
        if (!warden_id) {
            return res.status(401).json({ message: 'Unauthorized - Invalid warden token' });
        }

        const [requests] = await db.execute(
            `SELECT fr.*, s.s_name, s.room_no 
             FROM food_request fr
             JOIN student s ON fr.roll_no = s.roll_no
             JOIN hostel h ON fr.hostel_id = h.hostel_id
             JOIN warden w ON h.warden_id = w.Warden_id
             WHERE w.Warden_id = ?
             ORDER BY fr.date DESC`,
            [warden_id]
        );
        
        console.log('Found requests:', requests.length);
        res.json(requests);
    } catch (error) {
        console.error('Error fetching food requests:', error);
        res.status(500).json({ message: 'Failed to fetch food requests' });
    }
});

router.patch('/foodrequest/:food_id/status', verifyWardenToken, [
    body('status')
        .isIn(['Pending', 'Approved', 'Rejected'])
        .withMessage('Status must be Pending, Approved, or Rejected')
], async (req, res) => {
    try {
        const food_id = req.params.food_id.replace(':', '');
        const { status } = req.body;
        const warden_id = req.warden?.warden_id;

        console.log('Cleaned parameters:', {
            originalId: req.params.food_id,
            cleanedId: food_id,
            status,
            warden_id
        });

        const [foodRequests] = await db.execute(
            `SELECT fr.*, s.s_name, h.h_name, h.hostel_id
             FROM food_request fr
             JOIN student s ON fr.roll_no = s.roll_no
             JOIN hostel h ON s.hostel_id = h.hostel_id
             WHERE fr.food_id = ?`,
            [food_id]
        );

        if (!foodRequests || foodRequests.length === 0) {
            return res.status(404).json({ 
                message: 'Food request not found',
                debug: {
                    searched_id: food_id,
                    original_id: req.params.food_id,
                    warden_id: warden_id
                }
            });
        }

        const [result] = await db.execute(
            'UPDATE food_request SET status = ? WHERE food_id = ?',
            [status, food_id]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ message: 'Failed to update status' });
        }

        res.json({
            message: 'Food request status updated successfully',
            food_id,
            new_status: status
        });

    } catch (error) {
        console.error('Error updating food request:', error);
        res.status(500).json({ message: 'Failed to update food request status' });
    }
});



export default router;