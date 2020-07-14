'use strict';

const fs = require('fs');

const { LPVersion } = require('./constants');

module.exports = class UploadCourseContent {
	constructor(
		{
			contentDirectory,
			manifestPath,
			isDryRun
		},
		valence,
		fetch = require('node-fetch'),
		ModuleProcessor = require('./utility/module-processor'),
		FileHandler = require('./utility/file-handler')
	) {
		this._fetch = fetch;
		this._valence = valence;
		this._manifestPath = manifestPath;
		const fileHandler = new FileHandler(contentDirectory);

		this._moduleProcessor = new ModuleProcessor({ fileHandler, isDryRun }, valence);
	}

	/**
	 * Uploads course content to a Brightspace LMS
	 * @param {string} instanceUrl
	 * @param {number} orgUnitId
	 */
	async uploadCourseContent(
		instanceUrl,
		orgUnitId
	) {
		const whoAmI = await this._whoAmI(instanceUrl);
		console.log(`Running in user context: '${whoAmI.UniqueName}'`);

		const orgUnit = await this._getOrgUnit(instanceUrl, orgUnitId);
		console.log(`Found course offering: '${orgUnit.Name}' with id: '${orgUnit.Identifier}'`);

		const manifest = await this._getManifest();

		// Order matters on creates, so not using .map()
		for (const module of manifest.modules) {
			// eslint-disable-next-line no-await-in-loop
			await this._moduleProcessor.processModule(instanceUrl, orgUnit, module);
		}
	}

	async _getManifest() {
		const manifest = await fs.promises.readFile(this._manifestPath);

		return JSON.parse(manifest.toString('utf-8'));
	}

	async _getOrgUnit(instanceUrl, orgUnitId) {
		const url = new URL(`/d2l/api/lp/${LPVersion}/courses/${orgUnitId}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		return response.json();
	}

	async _whoAmI(instanceUrl) {
		const url = new URL(`/d2l/api/lp/${LPVersion}/users/whoami`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		return response.json();
	}
};
