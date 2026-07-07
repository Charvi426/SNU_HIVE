import mongoose from 'mongoose';

const CarpoolMessageSchema = new mongoose.Schema({
  ride_id: { type: String, ref: 'CarpoolRide', required: true },
  sender_roll_no: { type: String, ref: 'Student', required: true },
  text: { type: String, required: true },
  sent_at: { type: Date, default: Date.now }
});

export default mongoose.model('CarpoolMessage', CarpoolMessageSchema);
