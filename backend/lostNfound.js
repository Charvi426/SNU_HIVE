import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import LostAndFound from './models/LostAndFound.js';
import Student from './models/Student.js';
import verifyToken from './middleware/verifyToken.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/lostfound/');
    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg files are allowed!'));
    }
});

// GET all lost and found items
router.get('/lostfound', async (req, res) => {
    try {
        const items = await LostAndFound.find().sort({ report_date: -1 });
        // Get student names for each item
        const rollNos = items.map(item => item.roll_no).filter(Boolean);
        const students = await Student.find({ roll_no: { $in: rollNos } });

        const itemsWithImageUrls = items.map(item => {
            const student = students.find(s => s.roll_no === item.roll_no);
            return {
                ...item.toObject(),
                s_name: student?.s_name,
                image_path: item.image_path ? `https://snu-hive-backend.onrender.com/${item.image_path}` : null
            };
        });

        res.json(itemsWithImageUrls);
    } catch (error) {
        console.error('Error fetching lost and found items:', error);
        res.status(500).json({
            message: 'Failed to fetch items',
            error: error.message
        });
    }
});

// GET lost and found items by status
router.get('/lostfound/status/:status', async (req, res) => {
    try {
        const status = req.params.status.toUpperCase();
        if (!['LOST', 'FOUND'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const items = await LostAndFound.find({ status }).sort({ report_date: -1 });
        const rollNos = items.map(item => item.roll_no).filter(Boolean);
        const students = await Student.find({ roll_no: { $in: rollNos } });

        const itemsWithImageUrls = items.map(item => {
            const student = students.find(s => s.roll_no === item.roll_no);
            return {
                ...item.toObject(),
                s_name: student?.s_name,
                image_path: item.image_path ? `https://snu-hive-backend.onrender.com/${item.image_path}` : null
            };
        });

        res.json(itemsWithImageUrls);
    } catch (error) {
        console.error('Error fetching lost and found items:', error);
        res.status(500).json({
            message: 'Failed to fetch items',
            error: error.message
        });
    }
});

// POST report a lost/found item
router.post('/lostfound', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { item_name, found_location, status, phone_number } = req.body;

        // Use req.user or req.body for roll_no depending on your auth middleware
        const roll_no = req.user?.roll_no || req.body.roll_no;
        if (!roll_no) {
            return res.status(401).json({ message: 'User authentication failed' });
        }

        // Validate required fields
        if (!item_name || !found_location || !status || !phone_number) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const item_id = uuidv4().substring(0, 10);
        const report_date = new Date();
        const image_path = req.file ? req.file.path : null;

        const lostFound = new LostAndFound({
            item_id,
            roll_no,
            item_name,
            found_location,
            report_date,
            status,
            phone_number,
            image_path
        });

        await lostFound.save();

        res.status(201).json({
            message: 'Item reported successfully',
            item_id: item_id
        });

    } catch (error) {
        console.error('Error in lost and found post:', error);
        res.status(500).json({
            message: 'Failed to report item',
            error: error.message
        });
    }
});

export default router;