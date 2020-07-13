'use strict';

const core = require('@actions/core');
const ValenceAuth = require('./auth/valence-auth');
const UploadCourseContent = require('./upload-course-content');
const Validator = require('./validator');
const ValenceApi = require('./api/valence-api');

async function run() {
	const validator = new Validator(core);
	const valence = new ValenceAuth(validator.getValenceInput());
	const api = new ValenceApi(valence, validator.getIsDryRun());
	const inputs = {
		contentDirectory: validator.getContentDirectory(),
		manifestPath: validator.getManifestPath()
	};
	const uploader = new UploadCourseContent(inputs, api);

	const results = await uploader.uploadCourseContent(validator.getInstanceDomain(), validator.getCourseOrgUnitId());
	console.log(results);
}

run().catch(error => core.setFailed(error.message));

