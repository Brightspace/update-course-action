'use strict';

const fs = require('fs');

const ContentFactory = require('./content-factory');
const { DryRunFakeModule, LEVersion } = require('../constants');

module.exports = class ModuleProcessor {
	constructor(
		{ contentPath, isDryRun = false },
		valence,
		fetch = require('node-fetch'),
		TopicProcessor = require('./topic-processor'),
		QuizProcessor = require('./quiz-processor')
	) {
		this._contentPath = contentPath;
		this._dryRun = isDryRun;

		this._fetch = fetch;
		this._valence = valence;
		this._topicProcessor = new TopicProcessor({ contentPath, isDryRun }, valence);
		this._quizProcessor = new QuizProcessor({ isDryRun }, valence);

		this._markdownRegex = /.md$/i;
	}

	async processModule(instanceUrl, orgUnit, module, parentModule = null) {
		const items = await this._getContent(instanceUrl, orgUnit, parentModule);
		let self = Array.isArray(items) && items.find(m => m.Type === 0 && m.Title === module.title);

		if (self) {
			await this._updateModule({ instanceUrl, orgUnit, module, lmsModule: self });
		} else {
			self = await this._createModule(instanceUrl, orgUnit, module, parentModule);
		}

		// Order matters on creates, so not using .map()
		/* eslint-disable no-await-in-loop */
		for (const child of module.children) {
			switch (child.type) {
				case 'module':
					await this._processModule(instanceUrl, orgUnit, child, self);
					break;
				case 'quiz':
					await this._quizProcessor.processQuiz(instanceUrl, orgUnit, child, self);
					break;
				case 'resource':
					await this._processResource(instanceUrl, orgUnit, child, self);
					break;
				case 'topic':
					await this._topicProcessor.processTopic({ instanceUrl, orgUnit, topic: child, parentModule: self });
					break;
				default:
					throw new Error(`Unknown content type: ${child.type}`);
			}
		}
		/* eslint-enable no-await-in-loop */
	}

	async _createModule(instanceUrl, orgUnit, module, parentModule) {
		console.log(`Creating module: '${module.title}'`);

		const url = parentModule
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const descriptionFileName = module.descriptionFileName.replace(this._markdownRegex, '.html');
		const descriptionHtml = await fs.promises.readFile(`${this._contentPath}/${descriptionFileName}`);

		if (this._dryRun) {
			return DryRunFakeModule;
		}

		const description = ContentFactory.createRichText(descriptionHtml.toString('utf-8'), 'Html');

		const createModule = ContentFactory.createModule({
			title: module.title,
			description,
			dueDate: module.dueDate
		});

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				body: JSON.stringify(createModule)
			});

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}

	async _updateModule({ instanceUrl, orgUnit, module, lmsModule, isHidden = false }) {
		console.log(`Updating module: '${module.title}'`);

		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${lmsModule.Id}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		const descriptionFileName = module.descriptionFileName.replace(this._markdownRegex, '.html');
		const descriptionHtml = await fs.promises.readFile(`${this._contentPath}/${descriptionFileName}`);

		const description = ContentFactory.createRichText(descriptionHtml.toString('utf-8'), 'Html');

		const body = {
			...lmsModule,
			...{
				Title: module.title,
				ShortTitle: module.title,
				ModuleDueDate: module.dueDate || null,
				IsHidden: isHidden,
				Description: description
			}
		};

		if (this._dryRun) {
			return body;
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'PUT',
				body: JSON.stringify(body)
			});

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return body;
	}

	async _processResource(instanceUrl, orgUnit, resource, parentModule) {
		const topic = {
			...resource,
			...{
				title: resource.fileName
			}
		};

		return this._topicProcessor.processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden: true });
	}

	async _getContent(instanceUrl, orgUnit, parentModule = null) {
		const url = parentModule
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		if (this._dryRun && parentModule.Id === DryRunFakeModule.Id) {
			return DryRunFakeModule;
		}

		const response = await this._fetch(signedUrl);

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}
};