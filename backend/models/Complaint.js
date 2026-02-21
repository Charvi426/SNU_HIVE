import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  complaint_id: { type: String, required: true, unique: true },
  roll_no: { type: String, ref: 'Student'},
  hostel_id: { type: String, ref: 'Hostel' },
  d_name: { type: String, required: true },
  status: { type: String, required: true },
  complaint_date: { type: Date, required: true },
  description: { type: String, required: true, maxlength: 300 },
  image_path: { type: String, default: null }
});

export default mongoose.model('Complaint', ComplaintSchema);