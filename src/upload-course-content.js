'use strict';

const fs = require('fs');

module.exports = class UploadCourseContent {
	constructor(
		{
			contentDirectory,
			manifestPath
		},
		valence,
		Processor = require('./utility/processor')
	) {
		this._valence = valence;
		this._contentDir = contentDirectory;
		this._manifestPath = manifestPath;

		this._markdownRegex = /.md$/i;

		this._processor = new Processor({ contentPath: contentDirectory }, valence);
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
		const whoAmI = await this._valence.whoAmI(instanceUrl);
		console.log(`Running in user context: '${whoAmI.UniqueName}'`);

		const orgUnit = await this._valence.getOrgUnit(instanceUrl, orgUnitId);
		console.log(`Found course offering: '${orgUnit.Name}' with id: '${orgUnit.Identifier}'`);

		const manifest = await this._getManifest();

		const results = [];
		// Order matters on creates, so not using .map()
		for (const module of manifest.modules) {
			// eslint-disable-next-line no-await-in-loop
			const result = await this._processor.processModule(instanceUrl, orgUnit, module);
			results.push(...result);
		}

		return results;
	}

	async _getManifest() {
		const manifest = await fs.promises.readFile(this._manifestPath);

		return JSON.parse(manifest.toString('utf-8'));
	}
};
