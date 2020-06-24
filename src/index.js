'use strict';

const core = require('@actions/core');
const Content = require('./content');

async function run() {
	const inputDir = core.getInput('inputDirectory');
	console.log(inputDir);
	const content = new Content(inputDir);
	await content.readManifest();
}

run().catch(error => core.setFailed(error.message));
