'use strict';

const test = require('ava');
const fetchMock = require('fetch-mock');

const ValenceApi = require('../../api/valence-api');

const valenceMock = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

const orgUnit = {
	Identifier: 123,
	Path: '/content/course123/'
};

test('_getContent retrieves root content items', async t => {
	const data = require('../../testdata/get-content-root.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, data);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._getContent('https://example.com/', orgUnit);

	t.deepEqual(result, data.body);
});

test('_getContent throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, 400);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(async () => api._getContent('https://example.com/', orgUnit), { instanceOf: Error, message: 'Bad Request' });
});

test('_getContent retrieves module content items', async t => {
	const data = require('../../testdata/get-content-module.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/456/structure/' }, data);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._getContent('https://example.com/', orgUnit, { Id: 456 });

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

test('assertModule calls _createModule', async t => {
	const module = {
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>'
	};

	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, { status: 200, body: [] });

	const api = new ValenceApi(valenceMock, fetch);
	api._createModule = (url, ou, m, pm) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, orgUnit);
		t.deepEqual(m, module);
		t.is(pm, null);

		return {
			id: 1,
			...m
		};
	};

	const result = await api.assertModule('https://example.com/', orgUnit, module);

	t.deepEqual(result, {
		id: 1,
		...module
	});
});

test('assertModule calls _updateModule', async t => {
	const module = {
		id: 1,
		title: 'Module',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>'
	};

	const fetch = fetchMock.sandbox();
	const response = require('../../testdata/get-content-root.json');
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, response);

	const api = new ValenceApi(valenceMock, fetch);
	api._updateModule = (url, ou, s, m) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, orgUnit);
		t.deepEqual(s, response.body[0]);
		t.deepEqual(m, module);

		return m;
	};

	const result = await api.assertModule('https://example.com/', orgUnit, module);

	t.deepEqual(result, {
		id: 1,
		...module
	});
});

test('_createModule returns created module', async t => {
	const module = {
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>'
	};

	const response = require('../../testdata/post-module-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-module-request.json'), response);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._createModule('https://example.com/', orgUnit, module);

	t.deepEqual(result, {
		id: 1,
		...module
	});
});

test('_createModule returns created submodule', async t => {
	const module = {
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>'
	};

	const response = require('../../testdata/post-submodule-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-submodule-request.json'), response);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._createModule('https://example.com/', orgUnit, module, { Id: 1 });

	t.deepEqual(result, {
		id: 2,
		...module
	});
});

test('_createModule throws on HTTP error', async t => {
	const module = {};

	const fetch = fetchMock.sandbox();
	fetch.post({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, 400);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(async () => api._createModule('https://example.com/', orgUnit, module), { instanceOf: Error, message: 'Bad Request' });
});

test('_updateModule returns updated module', async t => {
	const self = {
		Id: 1,
		Title: 'Title',
		ShortTitle: 'Title',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:00.000Z',
		ParentModuleId: null,
		IsHidden: false,
		IsLocked: false,
		Description: {
			Html: '<html></html>'
		}
	};

	const module = {
		id: 1,
		title: 'NewTitle',
		type: 'module',
		dueDate: '2020-01-01T00:00:00.000Z',
		description: '<html>Update!</html>'
	};

	const fetch = fetchMock.sandbox();
	fetch.put(require('../../testdata/put-module-request.json'), 200);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._updateModule('https://example.com/', orgUnit, self, module);

	t.deepEqual(result, module);
});

test('assertTopic calls _createTopic', async t => {
	const testModule = {
		id: 1,
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>'
	};

	const testTopic = {
		title: 'Topic',
		type: 'topic',
		fileName: 'module/topic.md'
	};

	const testData = '<html></html>';

	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/' }, { status: 200, body: [] });

	const api = new ValenceApi(valenceMock, fetch);
	api._createTopic = (url, ou, { module, topic, data }) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, orgUnit);
		t.deepEqual(module, testModule);
		t.deepEqual(topic, testTopic);
		t.deepEqual(data, testData);

		return {
			id: 2,
			...topic
		};
	};

	const result = await api.assertTopic('https://example.com/', orgUnit, { module: testModule, topic: testTopic, data: testData });

	t.deepEqual(result, {
		id: 2,
		...testTopic
	});
});

test('assertTopic calls _updateTopic', async t => {
	const testModule = {
		id: 1,
		title: 'Module',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>'
	};

	const testTopic = {
		id: 2,
		title: 'Test Topic',
		type: 'Test topic',
		fileName: 'module/topic.md'
	};

	const testData = '<html></html>';

	const fetch = fetchMock.sandbox();
	const response = require('../../testdata/get-modules-response.json');
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/' }, response);

	const api = new ValenceApi(valenceMock, fetch);
	api._updateTopic = (url, ou, self, topic) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, orgUnit);
		t.deepEqual(self, response.body[0]);
		t.deepEqual(topic, testTopic);

		return topic;
	};

	api._updateTopicFile = (url, ou, { self, topic, data }) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, orgUnit);
		t.deepEqual(self, response.body[0]);
		t.deepEqual(topic, testTopic);
		t.is(data, testData);

		return topic;
	};

	const result = await api.assertTopic('https://example.com/', orgUnit, { module: testModule, topic: testTopic, data: testData });

	t.deepEqual(result, {
		id: 2,
		...testTopic
	});
});

test('_createTopic returns created topic', async t => {
	const topic = {
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md',
		isRequired: true
	};

	const response = require('../../testdata/post-topic-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/') {
			return false;
		}

		const contentType = options.headers['Content-Type'];
		if (!contentType.includes('multipart/mixed; boundary=')) {
			return false;
		}

		const boundary = options.headers['Content-Type'].match(/boundary=(?<boundary>.*?)$/).groups.boundary;

		return options.body === `--${boundary}\r\nContent-Disposition: form-data; name=""\r\nContent-Type: application/json\r\n\r\n`
			+ '{"Title":"Test Topic","ShortTitle":"Test Topic","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/test-topic.html","IsHidden":false,"IsLocked":false,"IsExempt":false}\r\n'
			+ `--${boundary}\r\nContent-Disposition: form-data; name=""; filename="test-topic.html"\r\nContent-Type: text/html\r\n\r\n<h1></h1>\r\n`
			+ `--${boundary}--\r\n`;
	}, response);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._createTopic('https://example.com/', orgUnit, { module: { id: 1 }, topic, data: '<h1></h1>' });

	t.deepEqual(result, {
		id: 2,
		...topic
	});
});

test('_createTopic throws on HTTP error', async t => {
	const topic = {
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md',
		isRequired: true
	};

	const fetch = fetchMock.sandbox();
	fetch.post('*', 400);

	const api = new ValenceApi(valenceMock, fetch);

	await t.throwsAsync(
		async () => api._createTopic('https://example.com/', orgUnit, { module: { id: 1 }, topic, fileName: 'test-module/test-topic.html', data: '<h1></h1>' }),
		{ instanceOf: Error, message: 'Bad Request' }
	);
});

test('_updateTopic returns updated topic', async t => {
	const self = {
		Id: 2,
		Title: 'Topic',
		ShortTitle: 'Topic',
		Type: 1,
		TopicType: 1,
		StartDate: null,
		EndDate: null,
		DueDate: null,
		Url: '/content/course123/test-module/test-topic.html',
		IsHidden: false,
		IsLocked: false,
		IsExempt: true
	};

	const topic = {
		id: 2,
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md'
	};

	const fetch = fetchMock.sandbox();
	fetch.put(require('../../testdata/put-topic-request.json'), 200);

	const api = new ValenceApi(valenceMock, fetch);

	const result = await api._updateTopic('https://example.com/', orgUnit, self, topic);

	t.deepEqual(result, {
		id: 2,
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md'
	});
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
