const logger = require('logger');
const TaskModel = require('models/task.model');
const { CronJob } = require('cron');
const DatasetTaskService = require('services/dataset-task.service');
const RetraivingError = require('errors/retraiving.error');
const NotFoundError = require('errors/notFound.error');

const tasks = {};

class TaskService {

    static async loadAllTasks() {
        logger.debug('Loading all tasks');
        const tasksFinded = await TaskModel.find();
        if (tasks) {
            for (let i = 0, { length } = tasksFinded; i < length; i++) {
                const task = tasksFinded[i];
                const datasetTask = new DatasetTaskService(task);
                tasks[task._id] = new CronJob(task.cronPattern, datasetTask.tick.bind(datasetTask), null, true, task.timezone);
            }
        }
        logger.info('Loaded all tasks');
    }

    static async createSyncDatasetTask(data) {
        logger.info('Creating task');
        logger.debug('Obtaining actual headers');
        let headers = null;
        try {
            headers = await DatasetTaskService.getHeadersOfUrl(data.url);
        } catch (err) {
            logger.error('Error obtaining headers of url', err);
            throw new RetraivingError(400, `${err.message}`);
        }
        data.lastUpdated = headers;
        const task = await new TaskModel(data).save();
        const datasetTask = new DatasetTaskService(task);
        logger.debug('Creating cron');
        tasks[task._id] = new CronJob(task.cronPattern, datasetTask.tick.bind(datasetTask), null, true, task.timezone);
        logger.info('Task created successfully');
        return task;
    }

    static async removeTaskSyncDataset(id) {
        logger.info('Removing task with datasetId ', id);
        const tasksFinded = await TaskModel.find({
            datasetId: id
        });
        if (tasksFinded) {
            for (let i = 0, { length } = tasksFinded; i < length; i++) {
                const task = tasksFinded[i];
                if (tasks[task._id]) {
                    tasks[task._id].stop();
                    delete tasks[task._id];
                    logger.debug('Stopped correctly');
                } else {
                    logger.debug('Dont exist cron in cache');
                }
            }
        }
        await TaskModel.remove({
            datasetId: id
        });
    }

    static async executeTaskSyncDataset(datasetId) {
        logger.debug('Executing task with datasetId', datasetId);
        const task = await TaskModel.findOne({
            datasetId
        });
        if (!task) {
            logger.error(`Task with datasetId ${datasetId} not found`);
            throw new NotFoundError(404, `Task with datasetId ${datasetId} not found`);
        }
        const datasetTask = new DatasetTaskService(task);
        datasetTask.tick();
    }

    static async updateSyncDatasetTask(data) {
        logger.debug('Checking if exists');
        let task = await TaskModel.findOne({
            datasetId: data.datasetId
        });
        if (task) {
            logger.info('Stopping all task');
            if (tasks[task._id]) {
                tasks[task._id].stop();
                delete tasks[task._id];
                logger.debug('Stopped correctly');
            } else {
                logger.debug('Dont exist cron in cache');
            }

            task.action = data.action || task.action;
            task.cronPattern = data.cronPattern || task.cronPattern;
            if (data.url !== task.url) {
                let headers = null;
                try {
                    headers = await DatasetTaskService.getHeadersOfUrl(data.url);
                } catch (err) {
                    logger.error('Error obtaining headers of url', err);
                    throw new RetraivingError(400, `${err.status}-${err.message}`);
                }
                data.lastUpdated = headers;
            }
            task.url = data.url || task.url;

            task = await task.save();
        } else {
            logger.info('Not exists task. Creating new');
            let headers = null;
            try {
                headers = await DatasetTaskService.getHeadersOfUrl(data.url);
            } catch (err) {
                logger.error('Error obtaining headers of url', err);
                throw new RetraivingError(400, `${err.status}-${err.message}`);
            }
            data.lastUpdated = headers;
            task = await new TaskModel(data).save();
        }
        logger.debug('Creating cron');
        const datasetTask = new DatasetTaskService(task);
        logger.debug('Task', task);
        tasks[task._id] = new CronJob(task.cronPattern, datasetTask.tick.bind(datasetTask), null, true, task.timezone);
        logger.info('Task updated successfully');
        return task;
    }

}

module.exports = TaskService;
