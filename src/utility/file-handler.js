'use strict';

const marked = require('marked');
const fs = require('fs');

module.exports = class FileHandler {
	constructor(
		contentPath
	) {
		this._contentPath = contentPath;
		this._fs = fs;
	}

	async getContent(fileName) {
		if (!fileName) {
			return null;
		}

		let data = await fs.promises.readFile(`${this._contentPath}/${fileName}`);

		// If the file is a markdown file, render it to HTML.
		if (fileName.match(/\.md$/)) {
			data = Buffer.from(marked(data.toString('utf-8')));
		}

		return data;
	}
};
