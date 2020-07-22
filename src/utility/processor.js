'use strict';

module.exports = class Processor {
	constructor(
		fileHandler,
		valence
	) {
		this._fileHandler = fileHandler;
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

	async _processResource(instanceUrl, orgUnit, resource, parentModule) {
		const data = await this._fileHandler.getContent(resource.fileName);
		const topic = {
			...resource,
			title: resource.fileName
		};

		return this._valence.assertTopic(instanceUrl, orgUnit, { module: parentModule, topic, data });
	}

	async _processTopic(instanceUrl, orgUnit, topic, parentModule) {
		const data = await this._fileHandler.getContent(topic.fileName);

		return this._valence.assertTopic(instanceUrl, orgUnit, { module: parentModule, topic, data: data.toString('utf8') });
	}

	async _processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
		return this._valence.assertQuiz(instanceUrl, orgUnit, quiz, parentModule);
	}

	async _getDescription(module) {
		if (!module.descriptionFileName) {
			return null;
		}

		const content = await this._fileHandler.getContent(module.descriptionFileName);
		return content.toString('utf8');
	}
};
