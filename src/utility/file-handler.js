import marked from 'marked';
import fs from 'fs';

export default class FileHandler {
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
