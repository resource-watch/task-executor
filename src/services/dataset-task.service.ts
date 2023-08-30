import { ITask } from "models/task.model";
import logger from 'logger';
import RetrievingError from "errors/retraiving.error";
import { RWAPIMicroservice } from "rw-api-microservice-node";
import { RequestToMicroserviceOptions } from "rw-api-microservice-node/dist/types";
import axios, { AxiosResponse } from "axios";

class DatasetTaskService {

    task: ITask;

    constructor(task: ITask) {
        this.task = task;
    }

    async sendRequestToDataset(): Promise<void> {
        let uri: string;
        if (this.task.action === 'concat') {
            uri = `/v1/dataset/${this.task.datasetId}/concat`;
        } else if (this.task.action === 'overwrite') {
            uri = `/v1/dataset/${this.task.datasetId}/data-overwrite`;
        }

        const options: RequestToMicroserviceOptions = {
            uri,
            method: 'POST',
            body: {
                url: this.task.url,
                provider: this.task.provider,
                dataPath: this.task.dataPath,
                legend: this.task.legend
            },
            headers: {
                'x-api-key': this.task.apiKey
            }
        };


        await RWAPIMicroservice.requestToMicroservice(options);
    }

    async execTick(): Promise<void> {
        const lastUpdated: Record<string, any> = { ...this.task.lastUpdated };
        try {
            const updated: boolean = await this.checkIfChangeWasUpdated();
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

    static async getHeadersOfUrl(url: string): Promise<{ lastModified: string, contentLength: string }> {
        const response: AxiosResponse<any> = await axios.head(url);
        if (response.status >= 400) {
            throw new RetrievingError(400, `Error obtaining file. Status: ${response.status}`);
        }
        return {
            lastModified: response.headers['last-modified'],
            contentLength: response.headers['content-length']
        };
    }

    async checkIfChangeWasUpdated(): Promise<boolean> {
        try {
            const headers: { lastModified: string; contentLength: string } = await DatasetTaskService.getHeadersOfUrl(this.task.url);
            const { lastModified } = headers;
            const { contentLength } = headers;
            logger.debug('Checking if it is necessary update');
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

    tick(): void {
        logger.debug('Executing tick', this.task);
        this.execTick().then(() => {
            logger.info(`Finish tick to task: ${this.task._id}`);
        }, (err: Error) => logger.error(`Error in task: ${this.task._id}`, err));
    }

}

export default DatasetTaskService;
