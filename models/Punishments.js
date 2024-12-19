const mongoose = require('mongoose');

const PunishmentsSchema = new mongoose.Schema({
    userId: String,
    duration: Number,
    reason: String,
    adminId: String,
    removedRoles: [String],
    endTime: Number,
    firstRoleAdded: { type: Boolean, default: false } // New field
});

const Punishments = mongoose.model('Punishments', PunishmentsSchema);
module.exports = Punishments;
