import logger from 'logger';
import { CronJob } from "cron";
import TaskModel, { ITask } from "models/task.model";
import DatasetTaskService from "services/dataset-task.service";
import RetrievingError from "errors/retraiving.error";
import NotFoundError from "errors/notFound.error";

const tasks: Record<string, any> = {};

class TaskService {

    static async loadAllTasks(): Promise<void> {
        logger.debug('Loading all tasks');
        const tasksFound: ITask[] = await TaskModel.find();
        if (tasks) {
            for (let i: number = 0, { length } = tasksFound; i < length; i++) {
                const task: ITask = tasksFound[i];
                const datasetTask: DatasetTaskService = new DatasetTaskService(task);
                tasks[task._id] = new CronJob(task.cronPattern, datasetTask.tick.bind(datasetTask), null, true, task.timezone);
            }
        }
        logger.info('Loaded all tasks');
    }

    static async createSyncDatasetTask(data: Record<string, any>, apiKey: string): Promise<ITask> {
        logger.info('Creating task');
        logger.debug('Obtaining actual headers');
        let headers: { lastModified: string, contentLength: string } = null;
        try {
            headers = await DatasetTaskService.getHeadersOfUrl(data.url);
        } catch (err) {
            logger.error('Error obtaining headers of url', err);
            throw new RetrievingError(400, `${err.message}`);
        }
        data.lastUpdated = headers;
        const task: ITask = await new TaskModel({ ...data, apiKey }).save();
        const datasetTask: DatasetTaskService = new DatasetTaskService(task);
        logger.debug('Creating cron');
        tasks[task._id] = new CronJob(task.cronPattern, datasetTask.tick.bind(datasetTask), null, true, task.timezone);
        logger.info('Task created successfully');
        return task;
    }

    static async removeTaskSyncDataset(id: string): Promise<void> {
        logger.info('Removing task with datasetId ', id);
        const tasksFound: ITask[] = await TaskModel.find({
            datasetId: id
        });
        if (tasksFound) {
            for (let i: number = 0, { length } = tasksFound; i < length; i++) {
                const task: ITask = tasksFound[i];
                if (tasks[task._id]) {
                    tasks[task._id].stop();
                    delete tasks[task._id];
                    logger.debug('Stopped correctly');
                } else {
                    logger.debug('Dont exist cron in cache');
                }
            }
        }
        await TaskModel.deleteOne({
            datasetId: id
        });
    }

    static async executeTaskSyncDataset(datasetId: string): Promise<void> {
        logger.debug('Executing task with datasetId', datasetId);
        const task: ITask = await TaskModel.findOne({
            datasetId
        });
        if (!task) {
            logger.error(`Task with datasetId ${datasetId} not found`);
            throw new NotFoundError(404, `Task with datasetId ${datasetId} not found`);
        }
        const datasetTask: DatasetTaskService = new DatasetTaskService(task);
        datasetTask.tick();
    }

    static async updateSyncDatasetTask(data: Record<string, any>): Promise<ITask> {
        logger.debug('Checking if exists');
        let task: ITask = await TaskModel.findOne({
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
                let headers: { lastModified: string, contentLength: string } = null;
                try {
                    headers = await DatasetTaskService.getHeadersOfUrl(data.url);
                } catch (err) {
                    logger.error('Error obtaining headers of url', err);
                    throw new RetrievingError(400, `${err.status}-${err.message}`);
                }
                data.lastUpdated = headers;
            }
            task.url = data.url || task.url;

            task = await task.save();
        } else {
            logger.info('Not exists task. Creating new');
            let headers: { lastModified: string, contentLength: string } = null;
            try {
                headers = await DatasetTaskService.getHeadersOfUrl(data.url);
            } catch (err) {
                logger.error('Error obtaining headers of url', err);
                throw new RetrievingError(400, `${err.status}-${err.message}`);
            }
            data.lastUpdated = headers;
            task = await new TaskModel(data).save();
        }
        logger.debug('Creating cron');
        const datasetTask: DatasetTaskService = new DatasetTaskService(task);
        logger.debug('Task', task);
        tasks[task._id] = new CronJob(task.cronPattern, datasetTask.tick.bind(datasetTask), null, true, task.timezone);
        logger.info('Task updated successfully');
        return task;
    }

}

export default TaskService;
