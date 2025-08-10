const mongoose = require("mongoose");

const userMessageCountSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    staffRole: { type: Boolean, default: false },
    eventRole: { type: Boolean, default: false },
    staffMessage: { type: Number, default: 0 },
    staffPoint: { type: Number, default: 0 },
    eventPoint: { type: Number, default: 0 },
    lastUpdated: { type: Number, default: Date.now() },
});

module.exports = mongoose.model("UserMessageCount", userMessageCountSchema);
