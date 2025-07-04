import express from 'express';
import { body, validationResult } from 'express-validator';
import FoodRequest from './models/FoodRequest.js';
import Hostel from './models/Hostel.js';
import verifyToken from './middleware/verifyToken.js';
import verifyWardenToken from './middleware/verifyWardenToken.js';
import Student from './models/Student.js';

const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ message: 'Food request routes working' });
});

// Create food request
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
        console.log('Validation errors:', errors.array()); 
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { food_id, type, date } = req.body;
        const roll_no = req.user?.roll_no; 

console.log('Food request body:', req.body);
console.log('Roll no from token:', roll_no);

        const student = await Student.findOne({ roll_no });
        
console.log('Student found:', student);
        if (!student?.hostel_id) {
            return res.status(400).json({ message: 'Student not assigned to any hostel' });
        }

        const foodRequest = new FoodRequest({
            food_id,
            roll_no,
            hostel_id: student.hostel_id,
            type,
            date,
            status: 'Pending'
        });

        await foodRequest.save();

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

// Get food requests for a student
router.get('/foodrequest/student', verifyToken, async (req, res) => {
    try {
        const roll_no = req.user?.roll_no;
        if (!roll_no) {
            return res.status(401).json({ message: 'No student roll number found in token' });
        }

        const requests = await FoodRequest.find({ roll_no }).sort({ date: -1 });
        const student = await Student.findOne({ roll_no });
        const hostel = student ? await Hostel.findOne({ hostel_id: student.hostel_id }) : null;

        const result = requests.map(fr => ({
            ...fr.toObject(),
            s_name: student?.s_name,
            h_name: hostel?.h_name
        }));

        res.json(result);
    } catch (err) {
        console.error("Error fetching food requests:", err);
        res.status(500).json({ 
            message: "Failed to fetch food requests", 
            error: err.message 
        });
    }
});

// Log route access
router.use((req, res, next) => {
    console.log('Food request route accessed:', {
        method: req.method,
        path: req.path,
        hasToken: !!req.headers.authorization
    });
    next();
});

// Get all food requests for a warden's hostel(s)
router.get('/foodrequests', verifyWardenToken, async (req, res) => {
    try {
        const warden_id = req.warden?.warden_id;
        if (!warden_id) {
            return res.status(401).json({ message: 'Unauthorized - Invalid warden token' });
        }

        // Find hostels managed by this warden
        const hostels = await Hostel.find({ warden_id });
        const hostelIds = hostels.map(h => h.hostel_id);

        // Find food requests for these hostels
        const requests = await FoodRequest.find({ hostel_id: { $in: hostelIds } }).sort({ date: -1 });
        const students = await Student.find({ roll_no: { $in: requests.map(r => r.roll_no) } });

        const result = requests.map(fr => {
            const student = students.find(s => s.roll_no === fr.roll_no);
            return {
                ...fr.toObject(),
                s_name: student?.s_name,
                room_no: student?.room_no
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching food requests:', error);
        res.status(500).json({ message: 'Failed to fetch food requests' });
    }
});

// Update food request status (warden)
router.patch('/foodrequest/:food_id/status', verifyWardenToken, [
    body('status')
        .isIn(['Pending', 'Approved', 'Rejected'])
        .withMessage('Status must be Pending, Approved, or Rejected')
], async (req, res) => {
    try {
        const food_id = req.params.food_id.replace(':', '');
        const { status } = req.body;
        const warden_id = req.warden?.warden_id;

        // Find the food request and related hostel
        const foodRequest = await FoodRequest.findOne({ food_id });
        if (!foodRequest) {
            return res.status(404).json({ message: 'Food request not found' });
        }

        const hostel = await Hostel.findOne({ hostel_id: foodRequest.hostel_id });
        if (!hostel || hostel.warden_id !== warden_id) {
            return res.status(403).json({ message: 'Not authorized to update this food request' });
        }

        foodRequest.status = status;
        await foodRequest.save();

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