import logger from 'logger';
import { Context, Next } from 'koa';
import ErrorSerializer from "serializers/error.serializer";
import TaskModel, { ITask } from "models/task.model";

class TaskValidator {

    static async existTask(ctx: Context, next: Next): Promise<void> {
        const task: ITask = await TaskModel.findById(ctx.params.id);
        if (!task) {
            ctx.throw(404, 'Task not found');
            return;
        }
        ctx.state.task = task;
        await next();

    }

    static async createOrUpdateTaskSyncDataset(ctx: Context, next: Next): Promise<void> {
        ctx.checkBody('cronPattern').notEmpty();
        ctx.checkBody('url').notEmpty().isUrl();
        ctx.checkBody('action').notEmpty().in(['overwrite', 'concat']);
        ctx.checkBody('provider').notEmpty().in(['json', 'csv', 'tsv', 'xml']);

        if (ctx.errors) {
            logger.error('Error validating task creation');
            ctx.body = ErrorSerializer.serializeValidationBodyErrors(ctx.errors);
            ctx.status = 400;
            return;
        }
        await next();
    }

}

export default TaskValidator;
