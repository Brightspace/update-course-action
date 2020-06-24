'use strict';

const { promises: fs } = require('fs');

module.exports = class Content {
	constructor(
		manifestPath, contentDirectory
	) {
		this._manifestPath = manifestPath;
		this._contentDirectory = contentDirectory;
	}

	_validateManifest(data) {
		console.log(data); // Just logging for now
	}

	/**
	 * Reads and interprets the manifest file
	 */
	async readManifest() {
		const manifest = await fs.readFile(this._manifestPath, 'utf8');
		this._validateManifest(manifest);
		return manifest;
	}
};
