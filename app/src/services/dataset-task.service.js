const logger = require('logger');
const request = require('request-promise');
const ctRegisterMicroservice = require('ct-register-microservice-node');
const RetraivingError = require('errors/retraiving.error');
class DatasetTaskService {

    constructor(task) {
        this.task = task;
    }

    async sendRequestToDataset() {
        const options = {
            method: 'POST',
            json: true,
            body: {
                url: this.task.url,
                provider: this.task.provider,
                dataPath: this.task.dataPath,
                legend: this.task.legend
            }
        };
        if (this.task.action === 'concat') {
            options.uri = `/dataset/${this.task.datasetId}/concat`;
        } else if (this.task.action === 'overwrite') {
            options.uri = `/dataset/${this.task.datasetId}/data-overwrite`;
        }

        await ctRegisterMicroservice.requestToMicroservice(options);
    }

    async execTick() {
        const lastUpdated = Object.assign({}, this.task.lastUpdated);
        try {
            const updated = await this.checkIfChangeWasUpdated();
            if (updated) {
                await this.sendRequestToDataset();
            }
        } catch (err) {
            this.task.lastCheck = {
                error: true,
                message: err.message,
                date: new Date()
            };
        } finally {
            if (this.task.lastCheck.error) {
                this.task.lastUpdated = lastUpdated;
            }
            logger.debug('Saving task', this.task);
            await this.task.save();
        }
    }

    static async getHeadersOfUrl(url) {
        const req = await request({
            uri: url,
            method: 'HEAD',
            simple: false,
            resolveWithFullResponse: true
        });
        if (req.statusCode >= 400) {
            throw new RetraivingError(400, `Error obtaining file. Status: ${req.statusCode}`);
        }
        return {
            lastModified: req.headers['last-modified'],
            contentLength: req.headers['content-length']
        };
    }

    async checkIfChangeWasUpdated() {
        try {
            const headers = await DatasetTaskService.getHeadersOfUrl(this.task.url);
            const lastModified = headers.lastModified;
            const contentLength = headers.contentLength;
            logger.debug('Checking if it is neccesary update');
            if ((lastModified || contentLength) && !this.task.lastUpdated) {

                this.task.lastUpdated = {
                    lastModified,
                    contentLength
                };
                this.task.lastCheck = {
                    error: false,
                    message: '',
                    date: new Date()
                };
                return true;
            }

            if (lastModified) {
                logger.debug('Checking if change lastModified');
                if (this.task.lastUpdated.lastModified !== lastModified) {
                    this.task.lastUpdated = {
                        lastModified,
                        contentLength
                    };
                    this.task.lastCheck = {
                        error: false,
                        message: `Change in lastModified(old: ${this.task.lastUpdated.lastModified}, new: ${lastModified}`,
                        date: new Date()
                    };
                    logger.debug('Change find in lastModified');
                    return true;
                }
            }
            if (contentLength) {
                logger.debug('Checking if change contentLength');
                if (this.task.lastUpdated.contentLength !== contentLength) {
                    this.task.lastUpdated = {
                        lastModified,
                        contentLength
                    };
                    this.task.lastCheck = {
                        error: false,
                        message: `Change in contentLength(old: ${this.task.lastUpdated.conentLength}, new: ${contentLength}`,
                        date: new Date()
                    };
                    logger.debug('Change find in content-length');
                    return true;
                }
            }
            this.task.lastCheck = {
                error: false,
                message: 'Same file',
                date: new Date()
            };
        } catch (err) {
            logger.error(`Error checking task with id ${this.task._id}`, err);
            this.task.lastCheck = {
                error: true,
                message: err.message,
                date: new Date()
            };
        }
        return false;
    }

    tick() {
        logger.debug('Executing tick', this.task);
        this.execTick().then(() => {
            logger.info(`Finish tick to task: ${this.task._id}`);
        }, err => logger.error(`Error in task: ${this.task._id}`, err));
    }

}

module.exports = DatasetTaskService;
