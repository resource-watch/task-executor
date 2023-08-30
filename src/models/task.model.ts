import type { Document, Schema as ISchema } from 'mongoose';
import { model, Schema } from 'mongoose';

export interface ITask extends Document {
    datasetId: string,
    cronPattern: string,
    url: string,
    timezone: string,
    action: string,
    provider: string,
    dataPath?: string,
    legend?: Record<string, any>,
    lastUpdated?: any
    lastCheck?: any
    apiKey: string
}


const Task: ISchema<ITask> = new Schema({
    datasetId: { type: String, required: true, trim: true },
    cronPattern: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    timezone: {
        type: String, required: true, trim: true, default: 'Europe/Madrid'
    },
    action: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    dataPath: { type: String, required: false, trim: true },
    apiKey: { type: String, required: true, trim: true },
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

export default model('Task', Task);
