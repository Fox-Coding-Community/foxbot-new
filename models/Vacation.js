const mongoose = require('mongoose');

const vacationSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    roles: { type: [String], required: true },
    endTime: { type: Number, required: true },
});

const Vacation = mongoose.model('Vacation', vacationSchema);
module.exports = Vacation;
