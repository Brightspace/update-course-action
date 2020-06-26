'use strict';

const validator = require('validator');

module.exports = class ActionValidator {
	constructor(core) {
		this.core = core;
	}

	getValenceInput() {
		const appId = this.core.getInput('valenceAppId');
		if (!validator.isLength(appId, {min: 1, max: 100})) {
			throw new TypeError('valenceAppId must be a string between 1 and 100 characters');
		}

		const appKey = this.core.getInput('valenceAppKey');
		validator.isLength(appKey, {min: 1, max: 100});
		if (!validator.isLength(appKey, {min: 1, max: 100})) {
			throw new TypeError('valenceAppKey must be a string between 1 and 100 characters');
		}

		const userId = this.core.getInput('valenceUserId');
		validator.isLength(userId, {min: 1, max: 100});
		if (!validator.isLength(userId, {min: 1, max: 100})) {
			throw new TypeError('valenceUserId must be a string between 1 and 100 characters');
		}

		const userKey = this.core.getInput('valenceUserKey');
		validator.isLength(userKey, {min: 1, max: 100});
		if (!validator.isLength(userKey, {min: 1, max: 100})) {
			throw new TypeError('valenceUserKey must be a string between 1 and 100 characters');
		}

		return {
			appId,
			appKey,
			userId,
			userKey
		};
	}

	getIsDryRun() {
		const isDryRun = this.core.getInput('dryRun');
		if (!validator.isBoolean(isDryRun)) {
			throw new TypeError('dryRun must be a boolean');
		}

		return validator.toBoolean(isDryRun);
	}

	getManifestPath() {
		const manifestPath = this.core.getInput('manifestPath');
		if (!validator.isLength(manifestPath, {min: 1, max: 200}) || !manifestPath.endsWith('.json')) {
			throw new TypeError('manifestPath must be a path a .json file');
		}

		return manifestPath;
	}

	getContentDirectory() {
		const contentDirectory = this.core.getInput('contentDirectory');
		if (!validator.isLength(contentDirectory, {min: 1, max: 200})) {
			throw new TypeError('contentDirectory must be a string between 1 and 200 characters');
		}

		return contentDirectory;
	}

	getInstanceDomain() {
		const instanceDomain = 'https://' + this.core.getInput('instanceDomain');
		// eslint-disable-next-line camelcase
		if (!validator.isURL(instanceDomain, {require_protocol: true, require_host: true})) {
			throw new TypeError('instanceDomain must be a domain. e.g. lms.example.com');
		}

		return new URL(instanceDomain);
	}

	getCourseOrgUnitId() {
		const courseOrgUnitId = this.core.getInput('courseOrgUnitId');
		if (!validator.isInt(courseOrgUnitId)) {
			throw new TypeError('courseOrgUnitId must be an integer');
		}

		return validator.toInt(courseOrgUnitId);
	}
};
