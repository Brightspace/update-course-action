'use strict';

const fetchMock = require('fetch-mock');
const test = require('ava');

const ValenceApi = require('../../api/valence-api');

const valenceMock = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

const orgUnit = {
	Identifier: 123
};

test('getContent retrieves root content items', async t => {
	const data = require('../../testdata/get-content-root.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, data);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.getContent('https://example.com/', orgUnit);

	t.deepEqual(result, data.body);
});

test('getContent throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, 400);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(async () => api.getContent('https://example.com/', orgUnit), { instanceOf: Error, message: 'Bad Request' });
});

test('getContent retrieves module content items', async t => {
	const data = require('../../testdata/get-content-module.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/456/structure/' }, data);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.getContent('https://example.com/', orgUnit, { Id: 456 });

	t.deepEqual(result, data.body);
});

test('getOrgUnit retrieves orgunit', async t => {
	const data = require('../../testdata/get-orgunit.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/courses/123' }, data);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.getOrgUnit('https://example.com/', 123);

	t.deepEqual(result, data.body);
});

test('getOrgUnit throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/courses/123' }, 404);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(async () => api.getOrgUnit('https://example.com/', 123), { instanceOf: Error, message: 'Not Found' });
});

test('createModule returns created module', async t => {
	const module = {
		Title: 'Title',
		ShortTitle: 'ShortTitle',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:000.0Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Content: '<html></html>',
			Type: 'Html'
		}
	};

	const response = require('../../testdata/post-module-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-module-request.json'), response);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.createModule('https://example.com/', orgUnit, module);

	t.deepEqual(result, response.body);
});

test('createModule returns created submodule', async t => {
	const module = {
		Title: 'Title',
		ShortTitle: 'ShortTitle',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:000.0Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Content: '<html></html>',
			Type: 'Html'
		}
	};

	const response = require('../../testdata/post-submodule-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-submodule-request.json'), response);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.createModule('https://example.com/', orgUnit, module, { Id: 1 });

	t.deepEqual(result, response.body);
});

test('createModule throws on HTTP error', async t => {
	const module = {};

	const fetch = fetchMock.sandbox();
	fetch.post({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, 400);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(async () => api.createModule('https://example.com/', orgUnit, module), { instanceOf: Error, message: 'Bad Request' });
});

test('updateModule returns updated module', async t => {
	const module = {
		Id: 1,
		Title: 'NewTitle',
		ShortTitle: 'NewShortTitle',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:000.0Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Content: '<html>Update!</html>',
			Type: 'Html'
		}
	};

	const fetch = fetchMock.sandbox();
	fetch.put(require('../../testdata/put-module-request.json'), 200);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.updateModule('https://example.com/', orgUnit, module);

	t.deepEqual(result, module);
});

test('whoAmI retrieves user', async t => {
	const data = require('../../testdata/get-whoami.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/users/whoami' }, data);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api.whoAmI('https://example.com/', 123);

	t.deepEqual(result, data.body);
});

test('whoAmI throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/users/whoami' }, 404);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(async () => api.whoAmI('https://example.com/', 123), { instanceOf: Error, message: 'Not Found' });
});
