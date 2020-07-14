'use strict';

const FormData = require('form-data');

const { DryRunFakeModule, LEVersion } = require('../constants');
const ContentFactory = require('./content-factory');

module.exports = class TopicProcessor {
	constructor(
		{ fileHandler, isDryRun = false },
		valence,
		fetch = require('node-fetch')
	) {
		this._fileHandler = fileHandler;
		this._dryRun = isDryRun;

		this._fetch = fetch;
		this._valence = valence;
	}

	async processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden = false }) {
		const topics = await this._getContent(instanceUrl, orgUnit, parentModule);
		const self = Array.isArray(topics) && topics.find(x => x.Type === 1 && x.TopicType === 1 && x.Title === topic.title);

		if (self) {
			await this._updateTopic(instanceUrl, orgUnit, topic, self);
			return self;
		}

		return this._createTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden });
	}

	async _createTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden }) {
		console.log(`Creating topic: '${topic.title}' with file: '${topic.fileName}'`);

		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const contentInfo = await this._fileHandler.getContent(topic.fileName);

		const createTopic = ContentFactory.createTopic({
			title: topic.title,
			url: `${orgUnit.Path}${topic.fileName}`,
			dueDate: topic.dueDate,
			isHidden,
			isExempt: !topic.isRequired
		});

		const formData = new FormData();
		formData.append(
			'',
			JSON.stringify(createTopic),
			{ contentType: 'application/json' }
		);
		formData.append(
			'',
			contentInfo.data,
			{ contentType: contentInfo.mimeType, filename: topic.fileName }
		);

		if (this._dryRun) {
			return {};
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': `multipart/mixed; boundary=${formData.getBoundary()}`
				},
				body: formData
			});

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}

	async _updateTopic(instanceUrl, orgUnit, topic, lmsTopic) {
		console.log(`Updating topic: '${topic.title}'`);

		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/topics/${lmsTopic.Id}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		const body = {
			...lmsTopic,
			...{
				Title: topic.title,
				ShortTitle: topic.title,
				Url: `${orgUnit.Path}${topic.fileName}`,
				DueDate: topic.dueDate || null,
				ResetCompletionTracking: true,
				IsExempt: !topic.isRequired
			}
		};

		if (!this._dryRun) {
			const response = await this._fetch(
				signedUrl,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(body)
				});

			if (!response.ok) {
				throw new Error(response.statusText);
			}
		}

		console.log(`Updating topic file: '${topic.fileName}'`);

		const fileUrl = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/topics/${lmsTopic.Id}/file`, instanceUrl);
		const signedFileUrl = this._valence.createAuthenticatedUrl(fileUrl, 'PUT');

		const contentInfo = await this._fileHandler.getContent(topic.fileName);

		const formData = new FormData();
		formData.append(
			'file',
			contentInfo.data,
			{ contentType: contentInfo.mimeType, filename: topic.fileName }
		);

		if (!this._dryRun) {
			const fileResponse = await this._fetch(
				signedFileUrl,
				{
					method: 'PUT',
					headers: {
						'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
					},
					body: formData
				});

			if (!fileResponse.ok) {
				throw new Error(fileResponse.statusText);
			}
		}

		return body;
	}

	async _getContent(instanceUrl, orgUnit, parentModule) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl);
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
