import core from '@actions/core';
import fetch from 'node-fetch';
import ValenceAuth from './auth/valence-auth.js';
import UploadCourseContent from './upload-course-content.js';
import Validator from './validator.js';
import ValenceApi from './api/valence-api.js';
import FileHandler from './utility/file-handler.js';
import LinkRewriter from './link-rewriter.js';

async function run() {
	const validator = new Validator(core);
	const valence = new ValenceAuth(validator.getValenceInput());
	const api = new ValenceApi(valence, validator.getIsDryRun(), fetch);
	const fileHandler = new FileHandler(validator.getContentDirectory());

	const uploader = new UploadCourseContent(validator.getManifestPath(), fileHandler, api);
	const rewriter = new LinkRewriter(fileHandler, api);

	const manifest = await uploader.uploadCourseContent(validator.getInstanceDomain(), validator.getCourseOrgUnitId());

	await rewriter.rewriteLinks(validator.getInstanceDomain(), validator.getCourseOrgUnitId(), manifest);
}

run().catch(error => core.setFailed(error.message));

