'use strict';

const fs = require('fs');

module.exports = class Processor {
	constructor(
		{ contentPath },
		valence
	) {
		this._contentPath = contentPath;
		this._valence = valence;
	}

	async processModule(instanceUrl, orgUnit, module, parentModule = null) {
		const results = [];

		module.description = await this._getDescription(module);

		const self = await this._valence.assertModule(instanceUrl, orgUnit, module, parentModule);
		results.push(self);

		// Order matters on creates, so not using .map()
		/* eslint-disable no-await-in-loop */
		let childResult;
		for (const child of module.children) {
			switch (child.type) {
				case 'module':
					childResult = await this.processModule(instanceUrl, orgUnit, child, self);
					results.push(...childResult);
					break;
				case 'quiz':
					childResult = await this._processQuiz(instanceUrl, orgUnit, child, self);
					results.push(childResult);
					break;
				case 'resource':
					childResult = await this._processResource(instanceUrl, orgUnit, child, self);
					results.push(childResult);
					break;
				case 'topic':
					childResult = await this._processTopic(instanceUrl, orgUnit, child, self);
					results.push(childResult);
					break;
				default:
					throw new Error(`Unknown content type: ${child.type}`);
			}
		}
		/* eslint-enable no-await-in-loop */

		return results;
	}

	async _processResource(instanceUrl, orgUnit, resource, module) {
		const topic = {
			...resource,
			title: resource.fileName
		};

		return this._processTopic(instanceUrl, orgUnit, topic, module);
	}

	async _processTopic(instanceUrl, orgUnit, topic, module) {
		const fileName = topic.fileName.replace(/.md$/, '.html');

		const buffer = await fs.promises.readFile(`${this._contentPath}/${fileName}`);
		const data = buffer.toString('utf-8');

		return this._valence.assertTopic(instanceUrl, orgUnit, { module, topic, data });
	}

	async _processQuiz(instanceUrl, orgUnit, quiz, module) {
		return this._valence.assertQuiz(instanceUrl, orgUnit, quiz, module);
	}

	async _getDescription(module) {
		if (!module.descriptionFileName) {
			return null;
		}

		const descriptionFileName = module.descriptionFileName.replace(/.md$/, '.html');
		const buffer = await fs.promises.readFile(`${this._contentPath}/${descriptionFileName}`);
		return buffer.toString();
	}
};
