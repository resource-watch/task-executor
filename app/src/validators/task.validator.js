const logger = require('logger');
const TaskModel = require('models/task.model');
const ErrorSerializer = require('serializers/error.serializer');

class TaskValidator {

    static async existTask(ctx, next) {
        const task = await TaskModel.findById(ctx.params.id);
        if (!task) {
            ctx.throw(404, 'Task not found');
            return;
        }
        ctx.state.task = task;
        await next();

    }

    static async createOrUpdateTaskSyncDataset(ctx, next) {
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

module.exports = TaskValidator;
