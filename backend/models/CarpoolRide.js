import mongoose from 'mongoose';

const JoinRequestSchema = new mongoose.Schema({
  roll_no: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  requested_at: { type: Date, default: Date.now }
}, { _id: false });

const CarpoolRideSchema = new mongoose.Schema({
  ride_id: { type: String, required: true, unique: true },
  creator_roll_no: { type: String, ref: 'Student', required: true },
  from_location: { type: String, required: true },
  from_place_id: { type: String, default: null },
  from_lat: { type: Number, default: null },
  from_lng: { type: Number, default: null },
  to_location: { type: String, required: true },
  to_place_id: { type: String, default: null },
  to_lat: { type: Number, default: null },
  to_lng: { type: Number, default: null },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  seats_total: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['Open', 'Full', 'Cancelled'], default: 'Open' },
  join_requests: { type: [JoinRequestSchema], default: [] },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('CarpoolRide', CarpoolRideSchema);
