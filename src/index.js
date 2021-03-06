'use strict';

const core = require('@actions/core');
const ValenceAuth = require('./auth/valence-auth');
const UploadCourseContent = require('./upload-course-content');
const Validator = require('./validator');
const ValenceApi = require('./api/valence-api');
const FileHandler = require('./utility/file-handler');
const LinkRewriter = require('./link-rewriter');

async function run() {
	const validator = new Validator(core);
	const valence = new ValenceAuth(validator.getValenceInput());
	const api = new ValenceApi(valence, validator.getIsDryRun());
	const fileHandler = new FileHandler(validator.getContentDirectory());

	const uploader = new UploadCourseContent(validator.getManifestPath(), fileHandler, api);
	const rewriter = new LinkRewriter(fileHandler, api);

	const manifest = await uploader.uploadCourseContent(validator.getInstanceDomain(), validator.getCourseOrgUnitId());

	await rewriter.rewriteLinks(validator.getInstanceDomain(), validator.getCourseOrgUnitId(), manifest);
}

run().catch(error => core.setFailed(error.message));

