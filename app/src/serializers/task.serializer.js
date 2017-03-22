const JSONAPISerializer = require('jsonapi-serializer').Serializer;

const taskSerializer = new JSONAPISerializer('task', {
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

    static serialize(data) {
        return taskSerializer.serialize(data);
    }

}

module.exports = TaskSerializer;
