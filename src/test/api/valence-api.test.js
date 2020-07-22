'use strict';

const test = require('ava');
const fetchMock = require('fetch-mock');

const ValenceApi = require('../../api/valence-api');

const ValenceMock = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

const OrgUnit = {
	Identifier: 123,
	Path: '/content/course123/'
};

const TestModule = {
	id: 1,
	title: 'Test Module',
	type: 'module',
	descriptionFileName: 'test-module/index.md',
	dueDate: '2020-01-01T00:00:00.000Z'
};

test('_getContent retrieves root content items', async t => {
	const data = require('../../testdata/get-content-root.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, data);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._getContent('https://example.com/', OrgUnit);

	t.deepEqual(result, data.body);
});

test('_getContent throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, 400);

	const api = new ValenceApi(ValenceMock, false, fetch);

	await t.throwsAsync(async () => api._getContent('https://example.com/', OrgUnit), { instanceOf: Error, message: 'Bad Request' });
});

test('_getContent retrieves module content items', async t => {
	const data = require('../../testdata/get-content-module.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/' }, data);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._getContent('https://example.com/', OrgUnit, TestModule);

	t.deepEqual(result, data.body);
});

test('getOrgUnit retrieves orgunit', async t => {
	const data = require('../../testdata/get-orgunit.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/courses/123' }, data);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api.getOrgUnit('https://example.com/', 123);

	t.deepEqual(result, data.body);
});

test('getOrgUnit throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/courses/123' }, 404);

	const api = new ValenceApi(ValenceMock, false, fetch);

	await t.throwsAsync(async () => api.getOrgUnit('https://example.com/', 123), { instanceOf: Error, message: 'Not Found' });
});

test('assertModule calls _createModule', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, { status: 200, body: [] });

	const api = new ValenceApi(ValenceMock, false, fetch);
	api._createModule = (url, ou, m, pm) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, OrgUnit);
		t.deepEqual(m, TestModule);
		t.is(pm, null);

		return {
			id: 1,
			...m
		};
	};

	const result = await api.assertModule('https://example.com/', OrgUnit, TestModule);

	t.deepEqual(result, {
		id: 1,
		...TestModule
	});
});

test('assertModule calls _updateModule', async t => {
	const fetch = fetchMock.sandbox();
	const response = require('../../testdata/get-content-root.json');
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, response);

	const api = new ValenceApi(ValenceMock, false, fetch);
	api._updateModule = (url, ou, { module, self }) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, OrgUnit);
		t.deepEqual(self, response.body[0]);
		t.deepEqual(module, TestModule);

		return module;
	};

	const result = await api.assertModule('https://example.com/', OrgUnit, TestModule);

	t.deepEqual(result, {
		id: 1,
		...TestModule
	});
});

test('_createModule returns created module', async t => {
	const module = {
		...TestModule,
		description: '<html></html>\n'
	};

	const response = require('../../testdata/post-module-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-module-request.json'), response);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._createModule('https://example.com/', OrgUnit, module);

	t.deepEqual(result, {
		id: 1,
		parent: null,
		...module
	});
});

test('_createModule returns created module (dry-run)', async t => {
	const module = {
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>',
		descriptionFileName: 'test-topic/index.md'
	};

	const fetch = fetchMock.sandbox();

	const api = new ValenceApi(ValenceMock, true, fetch);

	const result = await api._createModule('https://example.com/', OrgUnit, module);

	t.deepEqual(result, {
		id: 0,
		parent: null,
		...module
	});
});

test('_createModule returns created submodule', async t => {
	const module = {
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>',
		descriptionFileName: 'test-topic/index.md'
	};

	const response = require('../../testdata/post-submodule-response.json');
	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-submodule-request.json'), response);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._createModule('https://example.com/', OrgUnit, module, TestModule);

	t.deepEqual(result, {
		id: 2,
		parent: TestModule,
		...module
	});
});

test('_createModule returns created submodule (dry-run)', async t => {
	const module = {
		title: 'Title',
		type: 'module',
		dueDate: '2020-01-01T00:00:000.0Z',
		description: '<html></html>',
		descriptionFileName: 'test-topic/index.md'
	};

	const fetch = fetchMock.sandbox();

	const api = new ValenceApi(ValenceMock, true, fetch);

	const result = await api._createModule('https://example.com/', OrgUnit, module, TestModule);

	t.deepEqual(result, {
		id: 0,
		parent: TestModule,
		...module
	});
});

test('_createModule throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.post({ url: 'https://example.com/d2l/api/le/1.44/123/content/root/' }, 400);

	const api = new ValenceApi(ValenceMock, false, fetch);

	await t.throwsAsync(async () => api._createModule('https://example.com/', OrgUnit, TestModule), { instanceOf: Error, message: 'Bad Request' });
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
		descriptionFileName: 'test-topic/index.md',
		description: '<html>Update!</html>',
		parent: null
	};

	const fetch = fetchMock.sandbox();
	fetch.put(require('../../testdata/put-module-request.json'), 200);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._updateModule('https://example.com/', OrgUnit, { module, self });

	t.deepEqual(result, module);
});

test('_updateModule returns updated module (dry-run)', async t => {
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
		descriptionFileName: 'test-topic/index.md',
		description: '<html>Update!</html>',
		parent: null
	};

	const fetch = fetchMock.sandbox();

	const api = new ValenceApi(ValenceMock, true, fetch);

	const result = await api._updateModule('https://example.com/', OrgUnit, { module, self });

	t.deepEqual(result, module);
});

test('assertTopic calls _createTopic', async t => {
	const testTopic = {
		title: 'Topic',
		type: 'topic',
		fileName: 'module/topic.md'
	};

	const testData = '<html></html>';

	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/' }, { status: 200, body: [] });

	const api = new ValenceApi(ValenceMock, false, fetch);
	api._createTopic = (url, ou, { module, topic, data }) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, OrgUnit);
		t.deepEqual(module, TestModule);
		t.deepEqual(topic, testTopic);
		t.deepEqual(data, testData);

		return {
			id: 2,
			...topic
		};
	};

	const result = await api.assertTopic('https://example.com/', OrgUnit, { module: TestModule, topic: testTopic, data: testData });

	t.deepEqual(result, {
		id: 2,
		...testTopic
	});
});

test('assertTopic calls _updateTopic', async t => {
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

	const api = new ValenceApi(ValenceMock, false, fetch);
	api._updateTopic = (url, ou, { module, self, topic }) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, OrgUnit);
		t.deepEqual(self, response.body[0]);
		t.deepEqual(topic, testTopic);
		t.deepEqual(module, TestModule);

		return topic;
	};

	api._updateTopicFile = (url, ou, { module, self, topic, data }) => {
		t.is(url, 'https://example.com/');
		t.deepEqual(ou, OrgUnit);
		t.deepEqual(self, response.body[0]);
		t.deepEqual(topic, testTopic);
		t.deepEqual(module, TestModule);
		t.is(data, testData);

		return topic;
	};

	const result = await api.assertTopic('https://example.com/', OrgUnit, { module: TestModule, topic: testTopic, data: testData });

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
		const body = options.body.toString('utf8');

		return body === `--${boundary}\r\nContent-Disposition: form-data; name=""\r\nContent-Type: application/json\r\n\r\n`
			+ '{"Title":"Test Topic","ShortTitle":"Test Topic","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/test-topic.html","IsHidden":false,"IsLocked":false,"IsExempt":false}\r\n'
			+ `--${boundary}\r\nContent-Disposition: form-data; name=""; filename="test-topic.html"\r\nContent-Type: text/html\r\n\r\n<h1></h1>\r\n`
			+ `--${boundary}--\r\n`;
	}, response);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._createTopic('https://example.com/', OrgUnit, { module: TestModule, topic, data: '<h1></h1>' });

	t.deepEqual(result, {
		id: 2,
		parent: TestModule,
		...topic
	});
});

test('_createTopic returns created topic (dry-run)', async t => {
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

	const api = new ValenceApi(ValenceMock, true, fetch);

	const result = await api._createTopic('https://example.com/', OrgUnit, { module: TestModule, topic, data: '<h1></h1>' });

	t.deepEqual(result, {
		id: 0,
		parent: TestModule,
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

	const api = new ValenceApi(ValenceMock, false, fetch);

	await t.throwsAsync(
		async () => api._createTopic('https://example.com/', OrgUnit, { module: TestModule, topic, fileName: 'test-module/test-topic.html', data: '<h1></h1>' }),
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

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._updateTopic('https://example.com/', OrgUnit, { module: TestModule, self, topic });

	t.deepEqual(result, {
		id: 2,
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md',
		parent: TestModule
	});
});

test('_updateTopic returns updated topic (dry-run)', async t => {
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

	const api = new ValenceApi(ValenceMock, true, fetch);

	const result = await api._updateTopic('https://example.com/', OrgUnit, { module: TestModule, self, topic });

	t.deepEqual(result, {
		id: 2,
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md',
		parent: TestModule
	});
});

test('assertQuiz calls _createQuizTopic', async t => {
	const testQuiz = {
		title: 'Test Quiz',
		type: 'quiz'
	};

	const fetch = fetchMock.sandbox();
	const response = require('../../testdata/get-modules-response.json');
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/' }, response);
	fetch.get({ url: 'https://example.com/d2l/api/le/1.44/123/quizzes/' }, require('../../testdata/get-quizzes-response.json'));

	const api = new ValenceApi(ValenceMock, false, fetch);
	api._createQuizTopic = (instanceUrl, orgUnit, { module, quiz, quizItem }) => {
		t.is(instanceUrl, 'https://example.com');
		t.deepEqual(orgUnit, OrgUnit);
		t.deepEqual(module, TestModule);
		t.deepEqual(quiz, quiz);
		t.deepEqual(quizItem, {
			QuizId: 1,
			Name: 'Test Quiz',
			ActivityId: 'https://ids.brightspace.com/activities/quiz/Dev-1'
		});

		return {
			id: 3,
			...quiz
		};
	};

	const result = await api.assertQuiz('https://example.com', OrgUnit, testQuiz, TestModule);

	t.deepEqual(result, {
		id: 3,
		title: 'Test Quiz',
		type: 'quiz'
	});
});

test('_createQuizTopic returns created quiz', async t => {
	const quizItem = {
		QuizId: 1,
		Name: 'Test Quiz',
		ActivityId: 'https://ids.brightspace.com/activities/quiz/Dev-1'
	};

	const testQuiz = {
		title: 'Test Quiz',
		type: 'quiz'
	};

	const fetch = fetchMock.sandbox();
	fetch.post(require('../../testdata/post-quiztopic-request.json'), require('../../testdata/post-quiztopic-response.json'));

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api._createQuizTopic('https://example.com', OrgUnit, { module: TestModule, quiz: testQuiz, quizItem });

	t.deepEqual(result, {
		id: 3,
		parent: TestModule,
		...testQuiz
	});
});

test('whoAmI retrieves user', async t => {
	const data = require('../../testdata/get-whoami.json');
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/users/whoami' }, data);

	const api = new ValenceApi(ValenceMock, false, fetch);

	const result = await api.whoAmI('https://example.com/', 123);

	t.deepEqual(result, data.body);
});

test('whoAmI throws on HTTP error', async t => {
	const fetch = fetchMock.sandbox();
	fetch.get({ url: 'https://example.com/d2l/api/lp/1.26/users/whoami' }, 404);

	const api = new ValenceApi(ValenceMock, false, fetch);

	await t.throwsAsync(async () => api.whoAmI('https://example.com/', 123), { instanceOf: Error, message: 'Not Found' });
});
