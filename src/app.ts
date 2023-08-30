import config from 'config';
import logger from 'logger';
import Koa from 'koa';
import koaLogger from 'koa-logger';
import koaBody from 'koa-body';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import koaSimpleHealthCheck from 'koa-simple-healthcheck';
import mongoose, { CallbackError, ConnectOptions } from 'mongoose';
import { Server } from "http";
import { RWAPIMicroservice } from "rw-api-microservice-node";
import ErrorSerializer from "serializers/error.serializer";
import router from 'routes/task.router'
import TaskService from "services/task.service";

const mongoUri: string = process.env.MONGO_URI || `mongodb://${config.get('mongodb.host')}:${config.get('mongodb.port')}/${config.get('mongodb.database')}`;

interface IInit {
    server: Server;
    app: Koa;
}

const mongooseOptions: ConnectOptions = {
    readPreference: 'secondaryPreferred', // Has MongoDB prefer secondary servers for read operations.
    appName: 'task-executor', // Displays the app name in MongoDB logs, for ease of debug
    serverSelectionTimeoutMS: 10000, // Number of milliseconds the underlying MongoDB driver has to pick a server
};

const init: () => Promise<IInit> = async (): Promise<IInit> => {
    return new Promise(
        (
            resolve: (value: IInit | PromiseLike<IInit>) => void,
            reject: (reason?: any) => void,
        ) => {

            logger.info(`Connecting to MongoDB URL ${mongoUri}`);
            mongoose.connect(mongoUri, mongooseOptions).then(() => {

                const app: Koa = new Koa();
                app.use(koaSimpleHealthCheck());
                app.use(koaLogger());

                app.use(
                    koaBody({
                        multipart: true,
                        jsonLimit: '50mb',
                        formLimit: '50mb',
                        textLimit: '50mb',
                    }),
                );


                // catch errors and send in jsonapi standard. Always return vnd.api+json
                app.use(async (ctx: { status: number; response: { type: string; }; body: any; }, next: () => any) => {
                    try {
                        await next();
                    } catch (error) {
                        ctx.status = error.status || 500;

                        if (ctx.status >= 500) {
                            logger.error(error);
                        } else {
                            logger.info(error);
                        }

                        if (process.env.NODE_ENV === 'prod' && ctx.status === 500) {
                            ctx.response.type = 'application/vnd.api+json';
                            ctx.body = ErrorSerializer.serializeError(ctx.status, 'Unexpected error');
                            return;
                        }

                        ctx.response.type = 'application/vnd.api+json';
                        ctx.body = ErrorSerializer.serializeError(ctx.status, error.message);
                    }
                });

                app.use(
                    RWAPIMicroservice.bootstrap({
                        logger,
                        gatewayURL: process.env.GATEWAY_URL,
                        microserviceToken: process.env.MICROSERVICE_TOKEN,
                        fastlyEnabled: process.env.FASTLY_ENABLED as | boolean | 'true' | 'false',
                        fastlyServiceId: process.env.FASTLY_SERVICEID,
                        fastlyAPIKey: process.env.FASTLY_APIKEY,
                        requireAPIKey: process.env.REQUIRE_API_KEY as boolean | 'true' | 'false' || true,
                        awsCloudWatchLoggingEnabled: process.env.AWS_CLOUD_WATCH_LOGGING_ENABLED as boolean | 'true' | 'false' || true,
                        awsRegion: process.env.AWS_REGION,
                        awsCloudWatchLogStreamName: config.get('service.name'),
                    }),
                );

                app.use(router.middleware());

                const port: number = parseInt(config.get('service.port'), 10);

                const server: Server = app.listen(port, () => {
                    logger.info('Server started in ', port);

                    logger.info('Loading tasks');
                    TaskService.loadAllTasks().then(() => logger.info('Loaded all tasks correctly'), (error: Error) => {
                        logger.error('Error loading tasks', error);
                        process.exit(1);
                    });

                    resolve({ app, server });
                });

            }).catch((mongoConnectionError: CallbackError) => {
                logger.error('MongoURI', mongoUri);
                logger.error(mongoConnectionError);
                reject(new Error(mongoConnectionError.message));
            });
        });
};

export { init };
