'use strict';

const core = require('@actions/core');
const ValenceAuth = require('./auth/valence-auth');
const UploadCourseContent = require('./upload-course-content');
const Validator = require('validator');

async function run() {
	const validator = new Validator(core);
	const valence = new ValenceAuth(validator.getValenceInput());
	const inputs = {
		contentDirectory: validator.getContentDirectory(),
		manifestPath: validator.getManifestPath(),
		isDryRun: validator.getIsDryRun()
	};
	const uploader = new UploadCourseContent(inputs, valence);

	await uploader.uploadCourseContent(validator.getInstanceDomain(), validator.getCourseOrgUnitId());
}

run().catch(error => core.setFailed(error.message));

