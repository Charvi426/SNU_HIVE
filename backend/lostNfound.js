import express from 'express';
import LostAndFound from './models/LostAndFound.js';
import Student from './models/Student.js';
import verifyToken from './middleware/verifyToken.js';
import { upload, cloudinary } from './config/cloudinary.js';

const router = express.Router();

// Helper function to convert old file paths to Cloudinary URLs
const getImageUrl = (image_path) => {
    if (!image_path) return null;
    // If it's already a Cloudinary URL, return as is
    if (image_path.startsWith('http')) {
        return image_path;
    }
    // If it's just a filename, it's old data - return null since we can't serve it
    return null;
};

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
                image_path: getImageUrl(item.image_path)
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
                image_path: getImageUrl(item.image_path)
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
router.post('/lostfound', verifyToken, (req, res, next) => {
    console.log('Lost and Found POST request received:', {
        hasImage: !!req.files || !!req.file,
        contentType: req.headers['content-type'],
        bodyKeys: Object.keys(req.body)
    });
    
    // Wrap upload middleware with error handling
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('Upload middleware error:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            return res.status(400).json({ 
                message: 'File upload failed', 
                error: err.message,
                details: err.toString()
            });
        }
        console.log('Upload middleware succeeded, file:', req.file ? 'received' : 'no file');
        next();
    });
}, async (req, res) => {
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

        const { v4: uuidv4 } = await import('uuid');
        const item_id = uuidv4().substring(0, 10);
        const report_date = new Date();
        
        // Upload file to Cloudinary if present
        let image_path = null;
        if (req.file) {
            try {
                // Convert buffer to base64 for Cloudinary upload
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
                
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'snuhive/lostfound',
                    resource_type: 'auto'
                });
                
                image_path = result.secure_url;
                console.log('File uploaded to Cloudinary successfully:', {
                    filename: req.file.originalname,
                    url: image_path,
                    publicId: result.public_id
                });
            } catch (uploadErr) {
                console.error('Cloudinary upload error:', uploadErr);
                return res.status(400).json({ 
                    message: 'Failed to upload image to Cloudinary',
                    error: uploadErr.message
                });
            }
        }

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