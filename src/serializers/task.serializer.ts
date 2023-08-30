import { Serializer } from 'jsonapi-serializer';

const taskSerializer: Serializer = new Serializer('task', {
    attributes: ['datasetId', 'cronPattern', 'url', 'timezone', 'action', 'lastUpdated', 'lastCheck'],
    lastCheck: {
        attributes: ['error', 'date', 'message']
    },
    lastUpdated: {
        attributes: ['lastModified', 'contentLength']
    },
    keyForAttribute: 'camelCase'
});

class TaskSerializer {

    static serialize(data: Record<string, any>): any {
        return taskSerializer.serialize(data);
    }

}

export default TaskSerializer;
