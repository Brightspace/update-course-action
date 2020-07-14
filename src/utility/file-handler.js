'use strict';

const renderMarkdown = require('./markdown-worker');
const mime = require('mime');
const fs = require('fs');

module.exports = class FileHandler {
	constructor(
		contentPath,
		timeout = 3000
	) {
		this._contentPath = contentPath;
		this._fs = fs;
		this._timeoutDuration = timeout;
	}

	async _timeout(ms) {
		return new Promise((resolve, reject) => {
			const id = setTimeout(() => {
				clearTimeout(id);
				reject(new Error('Markdown renderer timed out.'));
			}, ms);
		});
	}

	async getContent(fileName) {
		if (!fileName) {
			return { data: null, mimeType: null};
		}

		let data = await fs.promises.readFile(`${this._contentPath}/${fileName}`);
		let mimeType = mime.getType(`${this._contentPath}/${fileName}`);

		// If the file is a markdown file, render it to HTML.
		if (mimeType === 'text/markdown') {
			// Run the render logic in a worker with a timeout
			data = await Promise.race([
				renderMarkdown(data),
				this._timeout(this._timeoutDuration)
			]).catch(error => {
				throw error;
			});
			mimeType = 'text/html';
		}

		return {data, mimeType};
	}
};
