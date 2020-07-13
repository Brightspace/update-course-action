'use strict';

const FormData = require('form-data');
const { LEVersion, LPVersion } = require('../constants');
const ContentFactory = require('../utility/content-factory');

module.exports = class ValenceApi {
	constructor(
		valence,
		fetch = require('node-fetch')
	) {
		this._valence = valence;
		this._fetch = fetch;
	}

	async _getContent(instanceUrl, orgUnit, module = null) {
		const url = module
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id || module.id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		this._assertResponse(response);

		return response.json();
	}

	async assertModule(instanceUrl, orgUnit, module, parentModule = null) {
		const contents = await this._getContent(instanceUrl, orgUnit, parentModule);
		const self = Array.isArray(contents) && contents.find(x => x.Type === 0 && x.Title === module.title);

		if (!self) {
			return this._createModule(instanceUrl, orgUnit, module, parentModule);
		}

		return this._updateModule(instanceUrl, orgUnit, self, module);
	}

	async _createModule(instanceUrl, orgUnit, module, parentModule = null) {
		const url = parentModule
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id || parentModule.id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);

		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const createModule = ContentFactory.createModule({
			title: module.title,
			description: module.description,
			dueDate: module.dueDate
		});

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

		return this._convertModule(module, json.Id);
	}

	async _updateModule(instanceUrl, orgUnit, self, module) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${self.Id}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		let isDirty = false;
		if (self.Title !== module.title) {
			self.Title = module.title;
			self.ShortTitle = module.title;
			isDirty = true;
		}

		if (self.Description.Html !== module.description) {
			self.Description.Html = module.description;
			isDirty = true;
		}

		if (self.ModuleDueDate !== module.dueDate) {
			self.ModuleDueDate = module.dueDate || null;
			isDirty = true;
		}

		if (!isDirty) {
			return module;
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

		return this._convertModule(module, self.Id);
	}

	async assertTopic(instanceUrl, orgUnit, { module, topic, data }) {
		const contents = await this._getContent(instanceUrl, orgUnit, module);
		const self = Array.isArray(contents) && contents.find(x => x.Type === 1 && x.Title === topic.title);

		if (!self) {
			return this._createTopic(instanceUrl, orgUnit, { module, topic, data });
		}

		await this._updateTopic(instanceUrl, orgUnit, self, topic);
		return this._updateTopicFile(instanceUrl, orgUnit, { self, topic, data });
	}

	async _createTopic(instanceUrl, orgUnit, { module, topic, data }) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id || module.id}/structure/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const fileName = topic.fileName.replace(/.md$/, '.html');
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
			{ filename: fileName }
		);

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': `multipart/mixed; boundary=${formData.getBoundary()}`
				},
				body: formData.getBuffer().toString('utf-8')
			});

		this._assertResponse(response);

		const json = await response.json();

		return this._convertTopic(topic, json.Id);
	}

	async _updateTopic(instanceUrl, orgUnit, self, topic) {
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

		if (!isDirty) {
			return topic;
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

		return this._convertTopic(topic, self.Id);
	}

	async _updateTopicFile(instanceUrl, orgUnit, { self, topic, data }) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/topics/${self.Id}/file`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		const fileName = topic.fileName.replace(/.md$/, '.html');
		const formData = new FormData();
		formData.append(
			'file',
			data,
			{ filename: `${fileName}` }
		);

		const response = await this._fetch(
			signedUrl,
			{
				method: 'PUT',
				headers: {
					'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
				},
				body: formData
			});

		this._assertResponse(response);

		return this._convertTopic(topic, self.Id);
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

	_convertModule(module, id) {
		return {
			...module,
			id
		};
	}

	_convertTopic(topic, id) {
		return {
			...topic,
			id
		};
	}
};
