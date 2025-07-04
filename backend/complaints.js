import express from 'express';
import Complaint from './models/Complaint.js';
import Student from './models/Student.js';
import verifyToken from './middleware/verifyToken.js';
import verifyAdminToken from './middleware/verifyAdminToken.js';
const router = express.Router();

// POST: Create a complaint
router.post('/complaint', verifyToken, async (req, res) => {
  const { description, hostel_id, d_name } = req.body;
  const roll_no = req.user?.roll_no;

  if (!roll_no || !description || !d_name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const complaint_id = `C${Date.now()}`;
  const complaint_date = new Date();

  try {
    const complaint = new Complaint({
      complaint_id,
      roll_no,
      hostel_id: hostel_id ?? null,
      d_name,
      status: 'Pending',
      complaint_date,
      description
    });

    await complaint.save();

    res.status(201).json({ message: "Complaint posted successfully", complaint_id });
  } catch (err) {
    console.error("Error inserting complaint:", err);
    res.status(500).json({ message: "Failed to post complaint", error: err.message });
  }
});

router.get('/complaint/student', verifyToken, async (req, res) => {
  const roll_no = req.user?.roll_no;
  try {
    const complaints = await Complaint.find({ roll_no }).select('-_id -__v');
    if (!complaints.length) {
      return res.status(404).json({ message: "No complaints found for this roll number" });
    }
    res.status(200).json(complaints);
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints", error: err.message });
  }
});

router.get('/department-complaints', verifyAdminToken, async (req, res) => {
  const { d_name } = req.admin;
  console.log('Admin department:', d_name);

  try {
    const complaints = await Complaint.find({ d_name }).sort({ complaint_date: -1 });
    console.log('Complaints found:', complaints.length, complaints);

    const rollNos = complaints.map(c => c.roll_no);
    const students = await Student.find({ roll_no: { $in: rollNos } });
    console.log('Students found:', students.length, students);

    const complaintsWithStudent = complaints.map(c => {
      const student = students.find(s => s.roll_no === c.roll_no);
      return {
        ...c.toObject(),
        s_name: student?.s_name,
        hostel_id: student?.hostel_id,
        room_no: student?.room_no
      };
    });

    console.log('Complaints with student:', complaintsWithStudent.length, complaintsWithStudent);

    res.status(200).json(complaintsWithStudent);
  } catch (err) {
    console.error("Error fetching department complaints:", err);
    res.status(500).json({ message: "Failed to fetch complaints", error: err.message });
  }
});

// PATCH: Update complaint status (admin)
router.patch('/complaint/:complaint_id/status', verifyAdminToken, async (req, res) => {
  const { complaint_id } = req.params;
  const { status } = req.body;
  const { d_name } = req.admin;

  const allowedStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const complaint = await Complaint.findOne({ complaint_id });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    if (complaint.d_name !== d_name) {
      return res.status(403).json({ message: "Not authorized to update this complaint" });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({
      message: "Complaint status updated successfully",
      complaint_id,
      new_status: status
    });
  } catch (err) {
    console.error("Error updating complaint status:", err);
    res.status(500).json({ message: "Failed to update complaint status", error: err.message });
  }
});

export default router;