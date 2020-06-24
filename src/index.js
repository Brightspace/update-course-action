'use strict';

const core = require('@actions/core');
const Content = require('./content');

async function run() {
	const manifestPath = core.getInput('manifestPath');
	const contentDirectory = core.getInput('contentDirectory');
	console.log(manifestPath);
	const content = new Content(manifestPath, contentDirectory);
	await content.readManifest();
}

run().catch(error => core.setFailed(error.message));
