import mongoose from 'mongoose';

const WardenSchema = new mongoose.Schema({
  warden_id: { type: String, required: true, unique: true },
  w_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact_no: { type: String, required: true, unique: true }
});

export default mongoose.model('Warden', WardenSchema);