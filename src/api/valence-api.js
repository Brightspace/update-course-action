'use strict';

const FormData = require('form-data');
const { DryRunId, LEVersion, LPVersion } = require('../constants');
const ContentFactory = require('../utility/content-factory');
const mime = require('mime');

module.exports = class ValenceApi {
	constructor(
		valence,
		isDryRun,
		fetch = require('node-fetch')
	) {
		this._valence = valence;
		this._isDryRun = isDryRun;
		this._fetch = fetch;
	}

	async _getContent(instanceUrl, orgUnit, module = null) {
		const url = module
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id || module.id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		if (this._isDryRun && module && module.id === DryRunId) {
			return [{
				Id: DryRunId,
				Type: 0
			}];
		}

		const response = await this._fetch(signedUrl);

		this._assertResponse(response);

		return response.json();
	}

	async _getQuizzes(instanceUrl, orgUnit) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/quizzes/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}

	async assertModule(instanceUrl, orgUnit, module, parentModule = null) {
		const contents = await this._getContent(instanceUrl, orgUnit, parentModule);
		const self = Array.isArray(contents) && contents.find(x => x.Type === 0 && x.Title === module.title);

		if (!self) {
			return this._createModule(instanceUrl, orgUnit, module, parentModule);
		}

		return this._updateModule(instanceUrl, orgUnit, { module, self }, parentModule);
	}

	async _createModule(instanceUrl, orgUnit, module, parentModule = null) {
		const url = parentModule
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id || parentModule.id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);

		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const data = module.description || '';
		console.log(`Creating module '${module.title}':  ${data.slice(0, 20)}...${data.length}...${data.slice(-20)}`);

		const createModule = ContentFactory.createModule({
			title: module.title,
			description: module.description,
			dueDate: module.dueDate
		});

		if (this._isDryRun) {
			return this._convertModule(module, DryRunId, parentModule);
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(createModule)
			});

		this._assertResponse(response);

		const json = await response.json();

		return this._convertModule(module, json.Id, parentModule);
	}

	async _updateModule(instanceUrl, orgUnit, { module, self }, parentModule = null) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${self.Id}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		const data = module.description || '';
		console.log(`Updating module '${self.Title}':  ${data.slice(0, 20)}...${data.length}...${data.slice(-20)}`);

		let isDirty = false;
		if (self.Title !== module.title) {
			self.Title = module.title;
			self.ShortTitle = module.title;
			isDirty = true;
		}

		if (self.Description.Html !== module.description) {
			self.Description = {
				Content: module.description,
				Type: 'Html'
			};
			isDirty = true;
		}

		if (self.ModuleDueDate !== module.dueDate) {
			self.ModuleDueDate = module.dueDate || null;
			isDirty = true;
		}

		if (!isDirty || this._isDryRun) {
			return this._convertModule(module, self.Id, parentModule);
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(self)
			});

		this._assertResponse(response);

		return this._convertModule(module, self.Id, parentModule);
	}

	async assertTopic(instanceUrl, orgUnit, { module, topic, data }) {
		const content = await this._getContent(instanceUrl, orgUnit, module);
		const self = Array.isArray(content) && content.find(x => x.Type === 1 && x.Title === topic.title);

		if (!self) {
			return this._createTopic(instanceUrl, orgUnit, { module, topic, data });
		}

		await this._updateTopic(instanceUrl, orgUnit, { module, topic, self });
		return this._updateTopicFile(instanceUrl, orgUnit, { module, topic, data, self });
	}

	async _createTopic(instanceUrl, orgUnit, { module, topic, data }) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id || module.id}/structure/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const fileName = topic.fileName.replace(/.md$/, '.html');
		if (fileName.endsWith('.html')) {
			console.log(`Creating topic '${fileName}':  ${data.slice(0, 20)}...${data.length}...${data.slice(-20)}`);
		} else {
			console.log(`Creating resource '${topic.title}' with file: '${fileName}'`);
		}

		const createTopic = ContentFactory.createTopic({
			title: topic.title,
			url: `${orgUnit.Path}${fileName}`,
			dueDate: topic.dueDate,
			isHidden: topic.type === 'resource',
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
			data,
			{ contentType: mime.getType(fileName), filename: fileName }
		);

		if (this._isDryRun) {
			return this._convertTopic(topic, DryRunId, module);
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': `multipart/mixed; boundary=${formData.getBoundary()}`
				},
				body: formData.getBuffer()
			});

		this._assertResponse(response);

		const json = await response.json();

		return this._convertTopic(topic, json.Id, module);
	}

	async _updateTopic(instanceUrl, orgUnit, { module, topic, self }) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/topics/${self.Id}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		let isDirty = false;
		if (self.Title !== topic.title) {
			self.Title = topic.title;
			self.ShortTitle = topic.title;
			isDirty = true;
		}

		if (self.DueDate !== topic.DueDate) {
			self.DueDate = topic.dueDate || null;
			isDirty = true;
		}

		if (self.IsExempt === topic.isRequired) {
			self.IsExempt = !topic.isRequired;
			isDirty = true;
		}

		self.ResetCompletionTracking = true;

		if (!isDirty || this._isDryRun) {
			return this._convertTopic(topic, self.Id, module);
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(self)
			});

		this._assertResponse(response);

		return this._convertTopic(topic, self.Id, module);
	}

	async _updateTopicFile(instanceUrl, orgUnit, { module, topic, data, self }) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/topics/${self.Id}/file`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		const fileName = topic.fileName.replace(/.md$/, '.html');
		if (fileName.endsWith('.html')) {
			console.log(`Updating topic '${fileName}':  ${data.slice(0, 20)}...${data.length}...${data.slice(-20)}`);
		} else {
			console.log(`Updating resource file: '${fileName}'`);
		}

		const formData = new FormData();
		formData.append(
			'file',
			data,
			{ contentType: mime.getType(fileName), filename: `${fileName}` }
		);

		if (this._isDryRun) {
			return this._convertTopic(topic, self.Id, module);
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'PUT',
				headers: {
					'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
				},
				body: formData.getBuffer()
			});

		this._assertResponse(response);

		return this._convertTopic(topic, self.Id, module);
	}

	async assertQuiz(instanceUrl, orgUnit, quiz, module) {
		const content = await this._getContent(instanceUrl, orgUnit, module);
		const self = Array.isArray(content) && content.find(x => x.Type === 1 && x.TopicType === 3 && x.Title === quiz.title);

		if (self) {
			// Nothing to do, the quicklink exists
			return quiz;
		}

		const quizzes = await this._getQuizzes(instanceUrl, orgUnit);
		const quizItem = quizzes.Objects && Array.isArray(quizzes.Objects) && quizzes.Objects.find(x => x.Name === quiz.title);

		return this._createQuizTopic(instanceUrl, orgUnit, { module, quiz, quizItem });
	}

	async _createQuizTopic(instanceUrl, orgUnit, { module, quiz, quizItem }) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id || module.id}/structure/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		console.log(`Creating quiz topic: '${quiz.title}'`);

		const rcode = quizItem.ActivityId.split('/').slice(-1)[0];
		const topic = ContentFactory.createTopic({
			title: quiz.title,
			topicType: 3,
			url: `/d2l/common/dialogs/quickLink/quickLink.d2l?ou=${orgUnit.Identifier}&type=quiz&rcode=${rcode}`,
			isExempt: !quiz.isRequired
		});

		if (this._isDryRun) {
			return this._convertTopic(quiz, DryRunId, module);
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(topic)
			}
		);

		this._assertResponse(response);

		const json = await response.json();

		return this._convertTopic(quiz, json.Id, module);
	}

	async getOrgUnit(instanceUrl, orgUnitId) {
		const url = new URL(`/d2l/api/lp/${LPVersion}/courses/${orgUnitId}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		this._assertResponse(response);

		return response.json();
	}

	async whoAmI(instanceUrl) {
		const url = new URL(`/d2l/api/lp/${LPVersion}/users/whoami`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		this._assertResponse(response);

		return response.json();
	}

	_assertResponse(response) {
		if (response.ok) {
			return;
		}

		throw new Error(response.statusText);
	}

	_convertModule(module, id, parent = null) {
		return {
			title: module.title,
			type: module.type,
			description: module.description,
			descriptionFileName: module.descriptionFileName,
			dueDate: module.dueDate,
			id,
			parent
		};
	}

	_convertTopic(topic, id, module) {
		return {
			...topic,
			id,
			parent: module
		};
	}
};
