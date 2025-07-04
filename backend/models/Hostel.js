import mongoose from 'mongoose';

const HostelSchema = new mongoose.Schema({
  hostel_id: { type: String, required: true, unique: true },
  h_name: { type: String, required: true },
  capacity: { type: Number, required: true },
  warden_id: { type: String, ref: 'Warden', default: null }
});

export default mongoose.models.Hostel || mongoose.model('Hostel', HostelSchema);