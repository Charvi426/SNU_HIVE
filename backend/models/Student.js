import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  roll_no: { type: String, required: true, unique: true },
  s_name: { type: String, required: true },
  dept: { type: String, required: true },
  batch: { type: Number, required: true },
  contact_no: { type: String, required: true, unique: true },
  snu_email_id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  room_no: { type: String, required: true },
  hostel_id: { type: String, ref: 'Hostel', default: null },
  parent_contact: { type: String, required: true },
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
});

export default mongoose.model('Student', StudentSchema);