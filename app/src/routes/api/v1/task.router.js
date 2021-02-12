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

    static async removeTaskSyncDataset(ctx) {
        logger.info('Removing task of sync dataset');
        await TaskService.removeTaskSyncDataset(ctx.params.id);
        ctx.body = '';
    }

    static async hook(ctx) {
        logger.info('Executing task by hook');
        await TaskService.executeTaskSyncDataset(ctx.params.id);
        ctx.body = '';
    }

}

const isMicroservice = async (ctx, next) => {
    let { loggedUser } = ctx.request.body;
    if (!loggedUser) {
        loggedUser = JSON.parse(ctx.query.loggedUser);
    }
    if (!loggedUser) {
        ctx.throw(401, 'Unauthorized');
        return;
    }
    if (loggedUser.id !== 'microservice') {
        ctx.throw(403, 'Not authorized');
        return;
    }
    await next();
};

const isAdmin = async (ctx, next) => {
    let { loggedUser } = ctx.request.body;
    if (!loggedUser) {
        loggedUser = JSON.parse(ctx.query.loggedUser);
    }
    if (!loggedUser) {
        ctx.throw(401, 'Unauthorized');
        return;
    }
    if (loggedUser.role !== 'ADMIN') {
        ctx.throw(403, 'Not authorized');
        return;
    }
    await next();
};

const isAuthenticatedMiddleware = async (ctx, next) => {
    logger.info(`Verifying if user is authenticated`);
    const { query, body } = ctx.request;

    const user = { ...(query.loggedUser ? JSON.parse(query.loggedUser) : {}), ...body.loggedUser };

    if (!user || !user.id) {
        ctx.throw(401, 'Unauthorized');
        return;
    }
    await next();
};

router.get('/', isAdmin, TaskRouter.get);
// TODO: Check permissions to this endpoint
// router.delete('/:id', isAdmin, TaskValidator.existTask, TaskRouter.get);
router.post('/sync-dataset', isMicroservice, TaskValidator.createOrUpdateTaskSyncDataset, TaskRouter.createTaskSyncDataset);
router.put('/sync-dataset/by-dataset', isAuthenticatedMiddleware, TaskValidator.createOrUpdateTaskSyncDataset, TaskRouter.updateTaskSyncDataset);
router.delete('/sync-dataset/by-dataset/:id', isAuthenticatedMiddleware, TaskRouter.removeTaskSyncDataset);
router.post('/sync-dataset/by-dataset/:id/hook', isAuthenticatedMiddleware, TaskRouter.hook);

module.exports = router;
