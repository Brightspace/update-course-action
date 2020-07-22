'use strict';

const jsdom = require('jsdom');
const path = require('path');

module.exports = class LinkRewriter {
	constructor(
		fileHandler,
		valence
	) {
		this._fileHandler = fileHandler;
		this._valence = valence;
	}

	async rewriteLinks(instanceUrl, orgUnitId, uploadedManifest) {
		const orgUnit = await this._valence.getOrgUnit(instanceUrl, orgUnitId);

		for (const item of uploadedManifest) {
			// eslint-disable-next-line no-await-in-loop
			await this._processItemLinks(instanceUrl, orgUnit, uploadedManifest, item);
		}
	}

	async _processItemLinks(instanceUrl, orgUnit, manifest, item) {
		const fileName = item.descriptionFileName || item.fileName;
		if (!fileName) {
			return;
		}

		const file = await this._getFileContents(item);

		const dom = new jsdom.JSDOM(file);

		const links = dom.window.document.querySelectorAll('a');

		let isDirty = false;
		for (const link of links) {
			const href = link.href;
			if (!href || href.includes('://') || href.startsWith('/') || href.startsWith('#')) {
				continue;
			}

			let targetPath = href;
			if (targetPath.startsWith('.')) {
				targetPath = path.normalize(path.join(path.dirname(fileName), targetPath)).replace(/\\/g, '/');
			}

			const target = manifest.find(x => x.descriptionFileName === targetPath || x.fileName === targetPath);
			if (!target) {
				throw new Error(`Could not find target of link in '${fileName}' to '${href}'. Resolved as '${targetPath}'`);
			}

			const newHref = this._getNewHref(orgUnit, target);

			console.log(`Updating link: '${href}' => '${newHref}'`);

			link.href = newHref;
			link.target = '_parent';

			isDirty = true;
		}

		if (isDirty) {
			const data = dom.serialize();

			if (item.type === 'module') {
				item.description = data;
				return this._valence.assertModule(instanceUrl, orgUnit, item, item.parent);
			}

			if (item.type === 'topic') {
				return this._valence.assertTopic(instanceUrl, orgUnit, { module: item.parent, topic: item, data });
			}
		}
	}

	async _getFileContents(item) {
		const fileName = item.descriptionFileName || item.fileName;
		const content = await this._fileHandler.getContent(fileName);
		return content.toString('utf8');
	}

	_getNewHref(orgUnit, target) {
		if (target.type === 'module') {
			return `/d2l/le/lessons/${orgUnit.Identifier}/units/${target.id}`;
		}

		if (target.type === 'topic') {
			return `/d2l/le/lessons/${orgUnit.Identifier}/topics/${target.id}`;
		}
	}
};
