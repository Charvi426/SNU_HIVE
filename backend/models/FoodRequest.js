import mongoose from 'mongoose';

const FoodRequestSchema = new mongoose.Schema({
  food_id: { type: String, required: true, unique: true },
  roll_no: { type: String, ref: 'Student', default: null },
  hostel_id: { type: String, ref: 'Hostel', default: null },
  type: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, required: true, default: 'Pending' },
  remarks: { type: String }
});

export default mongoose.model('FoodRequest', FoodRequestSchema);