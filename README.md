# Asynchronous Tasks Microservice


This repository is the node skeleton microservice to create node microservice for WRI API

## Dependencies

Dependencies on other Microservices:
- [Dataset](https://github.com/resource-watch/dataset/)

1. [Getting Started](#getting-started)

## Getting Started

**First, make sure that you have the [API gateway running
locally](https://github.com/Vizzuality/api-gateway/tree/production#getting-started).**

Start by cloning the repository from github to your execution environment

```
git clone https://github.com/resource-watch/task-executor.git && cd task-executor
```

After that, follow one of the instructions below:

### Using native execution

1 - Set up your environment variables. See `dev.env.sample` for a list of variables you should set, which are described in detail in [this section](#environment-variables) of the documentation. Native execution will NOT load the `dev.env` file content, so you need to use another way to define those values

2 - Install node dependencies using yarn:
```
yarn
```

3 - Start the application server:
```
yarn start
```

The endpoints provided by this microservice should now be available through Control Tower's URL.

### Using Docker

1 - Create and complete your `dev.env` file with your configuration. You can find an example `dev.env.sample` file in the project root.

2 - Execute the following command to run Control tower:

```
./task.sh develop
```

The endpoints provided by this microservice should now be available through Control Tower's URL.


You can now access the microservice through the API gateway.

### Configuration

It is necessary to define these environment variables:

* GATEWAY_URL => Control Tower URL
* NODE_ENV => Environment (prod, staging, dev)


