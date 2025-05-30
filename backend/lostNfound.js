import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import db from './db.js';
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

router.get('/lostfound', async (req, res) => {
    try {

         const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_NAME = 'LOSTANDFOUND'
        `);

        if (tables.length === 0) {
            return res.status(404).json({
                message: 'Lost and Found feature is not available yet',
                error: 'Table not found'
            });
        }

        const [items] = await db.execute(`
            SELECT lf.*, s.s_name 
            FROM LOSTANDFOUND lf
            LEFT JOIN STUDENT s ON lf.roll_no = s.roll_no
            ORDER BY lf.report_date DESC
        `);

        const itemsWithImageUrls = items.map(item => ({
            ...item,
            image_path: item.image_path ? 
                `http://localhost:5000/${item.image_path}` : null
        }));

        res.json(itemsWithImageUrls);

    } catch (error) {
        console.error('Error fetching lost and found items:', error);
        res.status(500).json({
            message: 'Failed to fetch items',
            error: error.message
        });
    }
});

router.get('/lostfound/status/:status', async (req, res) => {
    try {
        const status = req.params.status.toUpperCase();
        if (!['LOST', 'FOUND'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [items] = await db.execute(`
            SELECT lf.*, s.s_name 
            FROM LOSTANDFOUND lf
            LEFT JOIN STUDENT s ON lf.roll_no = s.roll_no
            WHERE lf.status = ?
            ORDER BY lf.report_date DESC
        `, [status]);

        const itemsWithImageUrls = items.map(item => ({
            ...item,
            image_path: item.image_path ? 
                `http://localhost:5000/${item.image_path}` : null
        }));

        res.json(itemsWithImageUrls);

    } catch (error) {
        console.error('Error fetching lost and found items:', error);
        res.status(500).json({
            message: 'Failed to fetch items',
            error: error.message
        });
    }
});

router.post('/lostfound', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { item_name, found_location, status,phone_number } = req.body;

        if (!req.user || !req.user.roll_no) {
            return res.status(401).json({ 
                message: 'User authentication failed' 
            });
        }

        const roll_no = req.user.roll_no; 
        const item_id = uuidv4().substring(0, 10); // Generate unique ID
        const report_date = new Date().toISOString().split('T')[0];
        const image_path = req.file ? req.file.path : null;

        // Validate required fields
        if (!item_name || !found_location || !status || !phone_number) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Insert into database
        await db.execute(
            `INSERT INTO LOSTANDFOUND (
                item_id, roll_no, item_name, found_location, 
                report_date, status, phone_number, image_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [item_id, roll_no, item_name, found_location, report_date, status, phone_number, image_path]
        );

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