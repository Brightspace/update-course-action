'use strict';

const parser = require('parse5');

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

		await Promise.all(
			uploadedManifest.map(async x => this._processItemLinks(instanceUrl, orgUnit, uploadedManifest, x))
		);
	}

	async _processItemLinks(instanceUrl, orgUnit, manifest, item) {
		if (!item.descriptionFileName && !item.fileName) {
			return;
		}

		const file = await this._getFileContents(item);
		const document = parser.parse(file);

		const links = this._getAllLinks(document);

		let isDirty = false;
		for (const link of links) {
			const href = link.attrs.find(x => x.name === 'href');
			if (!href || href.value.includes('://') || href.value.startsWith('/') || href.value.startsWith('#')) {
				continue;
			}

			console.log(`Found relative link: '${href.value}' in '${item.descriptionFileName || item.fileName}`);

			const targetFileName = href.value.replace('../', '');
			const target = manifest.find(x => x.descriptionFileName === targetFileName || x.fileName === targetFileName);
			if (!target) {
				throw new Error('Could not find matching content item');
			}

			const newHref = this._getNewHref(orgUnit, item, target);

			console.log(`Updating link: '${href.value}' => '${newHref}'`);

			href.value = newHref;

			const linkTarget = link.attrs.find(x => x.name === 'target');
			if (linkTarget) {
				linkTarget.value = '_parent';
			} else {
				link.attrs.push({ name: 'target', value: '_parent' });
			}

			isDirty = true;
		}

		if (isDirty) {
			const data = parser.serialize(document);

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
		return content.toString('utf-8');
	}

	* _getAllLinks(node) {
		if (!node) {
			return;
		}

		if (node.nodeName === 'a' || node.nodeName === 'd2l-link') {
			yield node;
		}

		if (!node.childNodes) {
			return;
		}

		for (const child of node.childNodes) {
			yield* this._getAllLinks(child);
		}
	}

	_getNewHref(orgUnit, item, target) {
		if (target.type === 'module') {
			return `/d2l/le/lessons/${orgUnit.Identifier}/units/${target.id}`;
		}

		if (target.type === 'topic') {
			return `/d2l/le/lessons/${orgUnit.Identifier}/topics/${target.id}`;
		}
	}
};
