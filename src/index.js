'use strict';

const core = require('@actions/core');
const ValenceAuth = require('./auth/valence-auth');
const UploadCourseContent = require('./upload-course-content');
const Validator = require('./validator');
const CourseLinkUpdater = require('./update-course-links');

async function run() {
	const validator = new Validator(core);
	const valence = new ValenceAuth(validator.getValenceInput());
	const inputs = {
		contentDirectory: validator.getContentDirectory(),
		manifestPath: validator.getManifestPath(),
		isDryRun: validator.getIsDryRun()
	};
	const uploader = new UploadCourseContent(inputs, valence);
	const linker = new CourseLinkUpdater(inputs, valence);

	const instanceUrl = validator.getInstanceDomain();
	const orgUnitId = validator.getCourseOrgUnitId();

	const structure = await uploader.uploadCourseContent(instanceUrl, orgUnitId);
	await linker.updateLinks(instanceUrl, orgUnitId, structure);
}

run().catch(error => core.setFailed(error.message));

