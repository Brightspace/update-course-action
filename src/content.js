'use strict';

const { promises: fs } = require('fs');
const path = require('path');

module.exports = class Content {
	constructor(
		{ rootPath }
	) {
		this._rootPath = rootPath;
	}

	_validateManifest(data) {
		console.log(data); // Just logging for now
	}

	/**
	 * Reads and interprets the manifest file
	 */
	async readManifest() {
		const manifestPath = path.join(this._rootPath, 'manifest.json');
		const manifest = await fs.readFile(manifestPath, 'utf8');
		console.log(manifestPath);
		this._validateManifest(manifest);
		return manifest;
	}
};
