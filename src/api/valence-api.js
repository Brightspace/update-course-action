'use strict';

const { LEVersion, LPVersion } = require('../constants');

module.exports = class ValenceApi {
	constructor(
		valence,
		fetch = require('node-fetch')
	) {
		this._valence = valence;
		this._fetch = fetch;
	}

	async getContent(instanceUrl, orgUnit, module = null) {
		const url = module
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		this._assertResponse(response);

		return response.json();
	}

	async createModule(instanceUrl, orgUnit, module, parentModule = null) {
		const url = parentModule
			? new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl)
			: new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/root/`, instanceUrl);

		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(module)
			});

		this._assertResponse(response);

		return response.json();
	}

	async updateModule(instanceUrl, orgUnit, module) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${module.Id}`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'PUT');

		const response = await this._fetch(
			signedUrl,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(module)
			});

		this._assertResponse(response);

		return module;
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
};
