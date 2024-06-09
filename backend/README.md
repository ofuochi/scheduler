# Description

Task scheduler manages users task and runs them in a robust and distributed fashion.

## Running the app

You can run the app in two ways - via docker or locally

You should create a `.env` file and copy `sample.env` to it to set the necessary values. Default values will be set if `.env` is missing. Default port is `3001`

I've also included a UI Dashboard for the Queue at the part `/board` to have visuals on the tasks within the queue. E.g if you used default values, visit `http://localhost:3001/board`. Relevant endpoints are in the `/tasks` path

### Running the app with docker

To build run the application within a docker container, simply run the following command

```docker
docker-compose up --build
```

### Running the app locally

To run the application locally, follow the using the following commands

```bash
# install dependencies
yarn install

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

### Testing

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
