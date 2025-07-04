import mongoose from 'mongoose';

const LostAndFoundSchema = new mongoose.Schema({
  item_id: { type: String, required: true, unique: true },
  roll_no: { type: String, ref: 'Student', default: null },
  item_name: { type: String, required: true },
  found_location: { type: String, required: true },
  report_date: { type: Date, required: true },
  status: { type: String, required: true },
  phone_number: { type: String, required: true },
  image_path: { type: String }
});

export default mongoose.model('LostAndFound', LostAndFoundSchema);