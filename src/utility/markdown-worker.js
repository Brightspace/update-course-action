'use strict';

const {
	Worker, isMainThread, parentPort, workerData
} = require('worker_threads');
const marked = require('marked');

if (isMainThread) {
	module.exports = function (toRender) {
		return new Promise((resolve, reject) => {
			const worker = new Worker(__filename, {
				workerData: toRender.toString('utf-8')
			});
			worker.on('message', html => {
				const data = Buffer.from(html);
				resolve(data);
			});
			worker.on('error', reject);
			worker.on('exit', code => {
				if (code !== 0) {
					reject(new Error(`Worker stopped with exit code ${code}`));
				}
			});
		});
	};
} else {
	const renderedHtml = marked(workerData);
	parentPort.postMessage(renderedHtml);
}
