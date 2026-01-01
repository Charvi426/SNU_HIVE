import mongoose from 'mongoose';

const SupportDeptSchema = new mongoose.Schema({
  D_Name: { 
    type: String, 
    enum: ['Maintenance', 'Pest-control', 'Housekeeping', 'IT'], 
    required: true, 
    unique: true 
  },
  warden_id: { type: String, ref: 'Warden', default: null },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  staff_capacity: { type: Number, required: true },
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
});

export default mongoose.model('SupportDept', SupportDeptSchema);