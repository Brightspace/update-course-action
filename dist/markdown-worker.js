'use strict';

const {
	parentPort, workerData
} = require('worker_threads');
const marked = require('marked');

const renderedHtml = marked(workerData);
parentPort.postMessage(renderedHtml);

