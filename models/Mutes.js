const mongoose = require('mongoose');

const MutesSchema = new mongoose.Schema({
    userId: String,
    duration: Number,
    reason: String,
    adminId: String,
    endTime: Number,
    muteRole: { type: Boolean, default: false }
});

const Mutes = mongoose.model('Mutes', MutesSchema);
module.exports = Mutes;
