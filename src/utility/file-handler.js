'use strict';

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
			console.log(`rendering ${fileName}`);
			data = data.toString('utf8');
			console.log(`rendered ${fileName}: ${data.slice(0, 20)}...${data.length}...${data.slice(-20)}`);
			data = Buffer.from(data);
		}

		return data;
	}
};
