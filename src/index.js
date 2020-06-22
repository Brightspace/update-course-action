'use strict';

const core = require('@actions/core');
const github = require('@actions/github');

const Content = require('./valence-auth');

async function run() {
	const inputDir = core.getInput('inputDirectory');
	const content = new Content(inputDir);
	console.log(github.context.payload);
	content.readManifest();
}

run().catch(error => core.setFailed(error.message));
