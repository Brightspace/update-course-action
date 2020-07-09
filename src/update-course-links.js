'use strict';

const parser = require('parse5');
const fs = require('fs');
const path = require('path');

const { LPVersion } = require('./constants');

module.exports = class CourseLinkUpdater {
	constructor(
		{
			contentDirectory,
			manifestPath,
			isDryRun
		},
		valence,
		fetch = require('node-fetch'),
		ModuleProcessor = require('./utility/module-processor')
	) {
		this._fetch = fetch;
		this._valence = valence;
		this._contentPath = contentDirectory;
		this._manifestPath = manifestPath;
		this._dryRun = isDryRun;

		this._markdownRegex = /.md$/i;
		this._htmlRegex = /.html$/i;

		this._moduleProcessor = new ModuleProcessor({ contentPath: contentDirectory, isDryRun }, valence);
	}

	async updateLinks(
		instanceUrl,
		orgUnitId,
		structure
	) {
		const orgUnit = await this._getOrgUnit(instanceUrl, orgUnitId);

		const manifest = await this._getManifest();
		for (const module of manifest.modules) {
			/* eslint-disable no-await-in-loop */
			await this._processModule(orgUnit, module, structure, manifest);

			await this._moduleProcessor.processModule(instanceUrl, orgUnit, module);
			/* eslint-enable no-await-in-loop */
		}
	}

	async _processModule(orgUnit, module, structure, manifest) {
		const fileName = module.descriptionFileName.replace(this._markdownRegex, '.html');
		const file = await fs.promises.readFile(`${this._contentPath}/${fileName}`);
		const directory = path.dirname(fileName);

		console.log(`Processing file: '${fileName}'`);

		const document = parser.parse(file.toString('utf-8'));
		const links = this._getAllLinks(document);

		for (const link of links) {
			const href = link.attrs.find(x => x.name === 'href');
			if (!href || href.value.includes('://') || href.value.includes('/d2l')) {
				continue;
			}

			// Found a relative link
			const hrefMd = href.value.replace(this._htmlRegex, '.md');
			const mdPath = `${directory}/${hrefMd}`;
			const entry = this._findInManifest(x => x.fileName === mdPath || x.descriptionFileName === mdPath, manifest);

			if (entry.type === 'module') {
				const foundModule = Array.isArray(structure) && structure.find(m => m.Type === 0 && m.Title === entry.title);

				const newHref = `/d2l/le/lessons/${orgUnit.Identifier}/units/${foundModule.Id}`;
				console.log(`Updating link: '${href.value}' => '${newHref}'`);
				href.value = newHref;
			}

			if (entry.type === 'topic') {
				const foundTopic = Array.isArray(structure) && structure.find(m => m.Type === 1 && m.Title === entry.title);

				const newHref = `/d2l/le/lessons/${orgUnit.Identifier}/topics/${foundTopic.Id}`;
				console.log(`Updating link: '${href.value}' => '${newHref}'`);
				href.value = newHref;
			}
		}

		await fs.promises.writeFile(`${this._contentPath}/${fileName}`, parser.serialize(document));

		for (const child of module.children) {
			if (child.type === 'module') {
				// eslint-disable-next-line no-await-in-loop
				await this._processModule(orgUnit, child, structure, manifest);
			}

			if (child.type === 'topic') {
				// eslint-disable-next-line no-await-in-loop
				await this._processTopic(orgUnit, child, structure, manifest);
			}
		}
	}

	async _processTopic(orgUnit, topic, structure, manifest) {
		const fileName = topic.fileName.replace(this._markdownRegex, '.html');
		const file = await fs.promises.readFile(`${this._contentPath}/${fileName}`);
		const directory = path.dirname(fileName);

		console.log(`Processing file: '${fileName}'`);

		const document = parser.parse(file.toString('utf-8'));
		const links = this._getAllLinks(document);

		for (const link of links) {
			const href = link.attrs.find(x => x.name === 'href');
			if (!href || href.value.includes('://') || href.value.includes('/d2l')) {
				continue;
			}

			// Found a relative link
			const hrefMd = href.value.replace(this._htmlRegex, '.md');
			const mdPath = `${directory}/${hrefMd}`;
			const entry = this._findInManifest(x => x.fileName === mdPath || x.descriptionFileName === mdPath, manifest);

			if (entry.type === 'module') {
				const foundModule = Array.isArray(structure) && structure.find(m => m.Type === 0 && m.Title === entry.title);

				const newHref = `/d2l/le/lessons/${orgUnit.Identifier}/units/${foundModule.Id}`;
				console.log(`Updating link: '${href.value}' => '${newHref}'`);
				href.value = newHref;
			}

			if (entry.type === 'topic') {
				const foundTopic = Array.isArray(structure) && structure.find(m => m.Type === 1 && m.Title === entry.title);

				const newHref = `/d2l/le/lessons/${orgUnit.Identifier}/topics/${foundTopic.Id}`;
				console.log(`Updating link: '${href.value}' => '${newHref}'`);
				href.value = newHref;
			}
		}

		await fs.promises.writeFile(`${this._contentPath}/${fileName}`, parser.serialize(document));
	}

	async _getManifest() {
		const manifest = await fs.promises.readFile(this._manifestPath);

		return JSON.parse(manifest.toString('utf-8'));
	}

	* _getAllLinks(node) {
		if (!node) {
			return;
		}

		if (node.nodeName === 'a') {
			yield node;
		}

		if (!node.childNodes) {
			return;
		}

		for (const child of node.childNodes) {
			yield* this._getAllLinks(child);
		}
	}

	_findInManifest(expression, item) {
		// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
		const module = item.modules && item.modules.find(expression);
		if (module) {
			return module;
		}

		// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
		const child = item.children && item.children.find(expression);
		if (child) {
			return child;
		}

		const moduleSearch = item.modules && item.modules.map(x => this._findInManifest(expression, x));
		if (moduleSearch) {
			return moduleSearch[0];
		}

		const childSearch = item.children && item.children.map(x => this._findInManifest(expression, x));
		if (childSearch) {
			return childSearch[0];
		}
	}

	async _getOrgUnit(instanceUrl, orgUnitId) {
		const url = new URL(`/d2l/api/lp/${LPVersion}/courses/${orgUnitId}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		return response.json();
	}
};
