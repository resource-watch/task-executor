import logger from 'logger';
import Router from 'koa-router';
import { Context, Next } from 'koa';
import TaskModel, { ITask } from "models/task.model";
import TaskValidator from "validators/task.validator";
import TaskSerializer from "serializers/task.serializer";
import TaskService from "services/task.service";

const router: Router = new Router({
    prefix: '/api/v1/task',
});

class TaskRouter {

    static async get(ctx: Context): Promise<void> {
        logger.info('Obtaining all tasks');
        const tasks: ITask[] = await TaskModel.find();

        ctx.body = TaskSerializer.serialize(tasks);
    }

    static async delete(ctx: Context): Promise<void> {
        logger.info('Obtaining all tasks');
        const tasks: ITask[] = await TaskModel.find();

        ctx.body = TaskSerializer.serialize(tasks);
    }

    static async createTaskSyncDataset(ctx: Context): Promise<void> {
        logger.info('Creating task of sync dataset');
        const task: ITask = await TaskService.createSyncDatasetTask(ctx.request.body, ctx.request.headers['x-api-key'] as string);
        ctx.body = TaskSerializer.serialize(task);
    }

    static async updateTaskSyncDataset(ctx: Context): Promise<void> {
        logger.info('Updating task of sync dataset');
        const task: ITask = await TaskService.updateSyncDatasetTask(ctx.request.body);
        ctx.body = TaskSerializer.serialize(task);
    }

    static async removeTaskSyncDataset(ctx: Context): Promise<void> {
        logger.info('Removing task of sync dataset');
        await TaskService.removeTaskSyncDataset(ctx.params.id);
        ctx.body = '';
    }

    static async hook(ctx: Context): Promise<void> {
        logger.info('Executing task by hook');
        await TaskService.executeTaskSyncDataset(ctx.params.id);
        ctx.body = '';
    }

}

const isMicroservice = async (ctx: Context, next: Next): Promise<any> => {
    let { loggedUser } = ctx.request.body;
    if (!loggedUser) {
        loggedUser = JSON.parse(ctx.query.loggedUser as string);
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

const isAdmin = async (ctx: Context, next: Next): Promise<any> => {
    let { loggedUser } = ctx.request.body;
    if (!loggedUser) {
        loggedUser = JSON.parse(ctx.query.loggedUser as string);
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

const isAuthenticatedMiddleware = async (ctx: Context, next: Next): Promise<any> => {
    logger.info(`Verifying if user is authenticated`);
    const { query, body } = ctx.request;

    const user: Record<string, any> = { ...(query.loggedUser ? JSON.parse(query.loggedUser as string) : {}), ...body.loggedUser };

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

export default router;
