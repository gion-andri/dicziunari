# Dicziunari

A dictionary application for rumantsch grischun deployable on android/ios with a simple ui or deployable as a node.js backend.

This project should currently be considered as a proof of concept. I had several intentions when I started with it:
* Provide a simplie dictionary app translating between german and rumantsch.
* The application should run on both ios and android based devices. To achieve this, I make use of https://ionicframework.com/.
* I was not familiar with the involved frameworks (Node.js, ionic) before. To me, this was also a learning project.

Dictionary lookup is achieved with an embedded sqlite database leveraging its [FTS5](https://www.sqlite.org/fts5.html) capabilities.


The dictionary data is not included and has to be retrieved as a JSON file from [http://www.pledarigrond.ch/rumantschgrischun/](http://www.pledarigrond.ch/rumantschgrischun/)


## Prerequisites
* [Node.js](https://nodejs.org/) and [ionic framework](https://ionicframework.com/docs/cli/#installation) installed

## Getting up and running

### Preparing the database

In `db-builder`, run
```
npm install
```
Then, copy the JSON-file conaining the dictionary data to `db-builder/data/rumantschgrischun_data_json.json`

Then, in order to build the database containing the dictionary, run
```
npm run convert
```

### Running the backend

For local development, you need to run a backend server. To do so, in `backend`, run

```
npm install
```
Then, run
```
npm run start
```
It will run a webserver serving query requests to the created sqlite database. This is only needed for running the app locally so you can debug/test it in your browser.

### Building the App

In app, run
```
ionic serve -c
```
This may take a while. Once the framework started, a browser tab should pop up with the running app.

In order to build the app for android and/or ios, check [the documentation of the ionic framework](https://ionicframework.com/docs/intro/deploying/).

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
