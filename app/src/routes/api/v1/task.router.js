const logger = require('logger');
const Router = require('koa-router');
const TaskValidator = require('validators/task.validator');
const TaskModel = require('models/task.model');
const TaskService = require('services/task.service');
const TaskSerializer = require('serializers/task.serializer');

const router = new Router({
    prefix: '/task',
});

class TaskRouter {

    static async get(ctx) {
        logger.info('Obtaining all tasks');
        const tasks = await TaskModel.find();

        ctx.body = TaskSerializer.serialize(tasks);
    }

    static async delete(ctx) {
        logger.info('Obtaining all tasks');
        const tasks = await TaskModel.find();

        ctx.body = TaskSerializer.serialize(tasks);
    }

    static async createTaskSyncDataset(ctx) {
        logger.info('Creating task of sync dataset');
        const task = await TaskService.createSyncDatasetTask(ctx.request.body);
        ctx.body = TaskSerializer.serialize(task);
    }

    static async updateTaskSyncDataset(ctx) {
        logger.info('Updating task of sync dataset');
        const task = await TaskService.updateSyncDatasetTask(ctx.request.body);
        ctx.body = TaskSerializer.serialize(task);
    }

}

router.get('/', TaskRouter.get);
router.delete('/:id', TaskValidator.existTask, TaskRouter.get);
router.post('/sync-dataset', TaskValidator.createOrUpdateTaskSyncDataset, TaskRouter.createTaskSyncDataset);
router.put('/sync-dataset/by-dataset', TaskValidator.createOrUpdateTaskSyncDataset, TaskRouter.updateTaskSyncDataset);


module.exports = router;
