import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import CarpoolRide from './models/CarpoolRide.js';
import CarpoolMessage from './models/CarpoolMessage.js';
import Student from './models/Student.js';
import verifyToken from './middleware/verifyToken.js';

const router = express.Router();

// Creator, or anyone who has requested to join (any status), can access the ride's chat
const isRideParticipant = (ride, roll_no) =>
  ride.creator_roll_no === roll_no || ride.join_requests.some(jr => jr.roll_no === roll_no);

const attachStudentNames = async (rides) => {
  const rollNos = new Set();
  rides.forEach(r => {
    rollNos.add(r.creator_roll_no);
    r.join_requests.forEach(jr => rollNos.add(jr.roll_no));
  });
  const students = await Student.find({ roll_no: { $in: [...rollNos] } }, 'roll_no s_name contact_no');
  const byRollNo = Object.fromEntries(students.map(s => [s.roll_no, s]));

  return rides.map(r => {
    const obj = r.toObject();
    obj.creator_name = byRollNo[r.creator_roll_no]?.s_name;
    obj.creator_contact = byRollNo[r.creator_roll_no]?.contact_no;
    obj.seats_approved = r.join_requests.filter(jr => jr.status === 'Approved').length;
    obj.seats_available = r.seats_total - obj.seats_approved;
    obj.join_requests = r.join_requests.map(jr => ({
      ...jr.toObject ? jr.toObject() : jr,
      s_name: byRollNo[jr.roll_no]?.s_name,
      contact_no: byRollNo[jr.roll_no]?.contact_no
    }));
    return obj;
  });
};

// Create a ride
router.post('/carpool', verifyToken, [
  body('from_location').notEmpty().withMessage('From location is required'),
  body('to_location').notEmpty().withMessage('To location is required'),
  body('date').isDate().withMessage('Invalid date format'),
  body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Time must be in HH:MM format'),
  body('seats_total').isInt({ min: 1 }).withMessage('Seats must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const roll_no = req.user?.roll_no;
    const {
      from_location, from_place_id, from_lat, from_lng,
      to_location, to_place_id, to_lat, to_lng,
      date, time, seats_total
    } = req.body;

    const ride = new CarpoolRide({
      ride_id: uuidv4().substring(0, 10),
      creator_roll_no: roll_no,
      from_location, from_place_id: from_place_id || null, from_lat: from_lat ?? null, from_lng: from_lng ?? null,
      to_location, to_place_id: to_place_id || null, to_lat: to_lat ?? null, to_lng: to_lng ?? null,
      date, time,
      seats_total: parseInt(seats_total, 10)
    });

    await ride.save();
    res.status(201).json({ message: 'Ride posted successfully', ride_id: ride.ride_id });
  } catch (error) {
    console.error('Error creating carpool ride:', error);
    res.status(500).json({ message: 'Failed to create ride' });
  }
});

// Browse all open rides (upcoming only)
router.get('/carpool', verifyToken, async (req, res) => {
  try {
    const roll_no = req.user?.roll_no;
    const rides = await CarpoolRide.find({
      status: { $ne: 'Cancelled' },
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }).sort({ date: 1 });

    const withNames = await attachStudentNames(rides);
    const result = withNames.map(ride => ({
      ...ride,
      is_creator: ride.creator_roll_no === roll_no,
      my_request: ride.join_requests.find(jr => jr.roll_no === roll_no) || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching carpool rides:', error);
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});

// Rides I created or requested to join
router.get('/carpool/mine', verifyToken, async (req, res) => {
  try {
    const roll_no = req.user?.roll_no;
    const rides = await CarpoolRide.find({
      $or: [{ creator_roll_no: roll_no }, { 'join_requests.roll_no': roll_no }]
    }).sort({ date: 1 });

    const withNames = await attachStudentNames(rides);
    const result = withNames.map(ride => ({
      ...ride,
      is_creator: ride.creator_roll_no === roll_no,
      my_request: ride.join_requests.find(jr => jr.roll_no === roll_no) || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching my carpool rides:', error);
    res.status(500).json({ message: 'Failed to fetch rides' });
  }
});

// Request to join a ride
router.post('/carpool/:ride_id/join', verifyToken, async (req, res) => {
  try {
    const roll_no = req.user?.roll_no;
    const ride = await CarpoolRide.findOne({ ride_id: req.params.ride_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.creator_roll_no === roll_no) {
      return res.status(400).json({ message: 'You cannot join your own ride' });
    }
    if (ride.status !== 'Open') {
      return res.status(400).json({ message: `This ride is ${ride.status.toLowerCase()}` });
    }
    if (ride.join_requests.some(jr => jr.roll_no === roll_no)) {
      return res.status(400).json({ message: 'You already requested to join this ride' });
    }

    ride.join_requests.push({ roll_no, status: 'Pending' });
    await ride.save();

    res.json({ message: 'Join request sent' });
  } catch (error) {
    console.error('Error requesting to join carpool ride:', error);
    res.status(500).json({ message: 'Failed to send join request' });
  }
});

// Creator approves or rejects a join request
router.patch('/carpool/:ride_id/requests/:roll_no', verifyToken, [
  body('status').isIn(['Approved', 'Rejected']).withMessage('Status must be Approved or Rejected')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const creatorRollNo = req.user?.roll_no;
    const { status } = req.body;
    const ride = await CarpoolRide.findOne({ ride_id: req.params.ride_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.creator_roll_no !== creatorRollNo) {
      return res.status(403).json({ message: 'Only the ride creator can respond to requests' });
    }

    const joinRequest = ride.join_requests.find(jr => jr.roll_no === req.params.roll_no);
    if (!joinRequest) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    const approvedCount = ride.join_requests.filter(jr => jr.status === 'Approved').length;
    if (status === 'Approved' && approvedCount >= ride.seats_total) {
      return res.status(400).json({ message: 'No seats remaining' });
    }

    joinRequest.status = status;

    const newApprovedCount = ride.join_requests.filter(jr => jr.status === 'Approved').length;
    ride.status = newApprovedCount >= ride.seats_total ? 'Full' : 'Open';

    await ride.save();
    res.json({ message: `Request ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Error updating carpool join request:', error);
    res.status(500).json({ message: 'Failed to update join request' });
  }
});

// Creator cancels their ride
router.delete('/carpool/:ride_id', verifyToken, async (req, res) => {
  try {
    const roll_no = req.user?.roll_no;
    const ride = await CarpoolRide.findOne({ ride_id: req.params.ride_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.creator_roll_no !== roll_no) {
      return res.status(403).json({ message: 'Only the ride creator can cancel this ride' });
    }

    ride.status = 'Cancelled';
    await ride.save();
    res.json({ message: 'Ride cancelled' });
  } catch (error) {
    console.error('Error cancelling carpool ride:', error);
    res.status(500).json({ message: 'Failed to cancel ride' });
  }
});

// Fetch chat messages for a ride (creator + anyone who requested to join)
router.get('/carpool/:ride_id/messages', verifyToken, async (req, res) => {
  try {
    const roll_no = req.user?.roll_no;
    const ride = await CarpoolRide.findOne({ ride_id: req.params.ride_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (!isRideParticipant(ride, roll_no)) {
      return res.status(403).json({ message: 'You do not have access to this ride\'s chat' });
    }

    const messages = await CarpoolMessage.find({ ride_id: req.params.ride_id }).sort({ sent_at: 1 });
    const students = await Student.find({ roll_no: { $in: messages.map(m => m.sender_roll_no) } }, 'roll_no s_name');
    const byRollNo = Object.fromEntries(students.map(s => [s.roll_no, s]));

    res.json(messages.map(m => ({
      ...m.toObject(),
      sender_name: byRollNo[m.sender_roll_no]?.s_name
    })));
  } catch (error) {
    console.error('Error fetching carpool messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a chat message for a ride (creator + anyone who requested to join)
router.post('/carpool/:ride_id/messages', verifyToken, [
  body('text').trim().notEmpty().withMessage('Message text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const roll_no = req.user?.roll_no;
    const ride = await CarpoolRide.findOne({ ride_id: req.params.ride_id });
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (!isRideParticipant(ride, roll_no)) {
      return res.status(403).json({ message: 'You do not have access to this ride\'s chat' });
    }

    const message = new CarpoolMessage({
      ride_id: req.params.ride_id,
      sender_roll_no: roll_no,
      text: req.body.text
    });
    await message.save();

    res.status(201).json({ message: 'Message sent' });
  } catch (error) {
    console.error('Error sending carpool message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
