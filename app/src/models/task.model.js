const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Task = new Schema({
    datasetId: { type: String, required: true, trim: true },
    cronPattern: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, trim: true, default: 'Europe/Madrid' },
    action: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    dataPath: { type: String, required: false, trim: true },
    legend: { type: Schema.Types.Mixed },
    lastUpdated: {
        _id: false,
        lastModified: { type: String, required: false },
        contentLength: { type: String, required: false }
    },
    lastCheck: {
        _id: false,
        error: { type: Boolean, required: false, default: false },
        date: { type: Date, required: false },
        message: { type: String, required: false, trim: true }
    }
});

module.exports = mongoose.model('Task', Task);
