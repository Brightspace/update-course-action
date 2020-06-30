'use strict';

const fetchMock = require('fetch-mock');
const path = require('path');
const test = require('ava');

const { DryRunFakeModule } = require('../../constants');
const ModuleProcessor = require('../../utility/module-processor');

const ContentPath = path.join(__dirname, '..', 'content');

const MockValence = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

const OrgUnit = {
	Identifier: '123',
	Name: 'Org Unit',
	Path: '/content/course123/'
};

const TestModule = {
	title: 'Test Module',
	type: 'module',
	descriptionFileName: 'test-module/index.md',
	dueDate: '2020-01-01T00:00:00.000Z',
	children: [
		{
			title: 'Test Topic',
			type: 'topic',
			fileName: 'test-module/test-topic.md',
			isRequired: true
		},
		{
			title: 'Test Quiz',
			type: 'quiz'
		},
		{
			type: 'resource',
			fileName: 'test-module/resource.txt'
		}
	]
};

test('creates module', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/root/'
	}, {
		body: ''
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/root/') {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': 'application/json'
		});

		t.deepEqual(JSON.parse(options.body), {
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Content: '<html></html>\n',
				Type: 'Html'
			}
		});

		return true;
	}, {
		Id: 1,
		Title: 'Test Module',
		ShortTitle: 'Test Module',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:00.000Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Html: '<html></html>\n'
		}
	});

	class MockTopicProcessor {
		processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden = false }) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			if (topic.title === 'Test Topic') {
				t.deepEqual(topic, {
					title: 'Test Topic',
					type: 'topic',
					fileName: 'test-module/test-topic.md',
					isRequired: true
				});
				t.is(isHidden, false);
			} else {
				t.deepEqual(topic, {
					title: 'test-module/resource.txt',
					type: 'resource',
					fileName: 'test-module/resource.txt'
				});
				t.is(isHidden, true);
			}

			t.deepEqual(parentModule, {
				Id: 1,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	class MockQuizProcessor {
		processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(quiz, {
				title: 'Test Quiz',
				type: 'quiz'
			});
			t.deepEqual(parentModule, {
				Id: 1,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	const processor = new ModuleProcessor({ contentPath: ContentPath }, MockValence, fetch, MockTopicProcessor, MockQuizProcessor);

	await processor.processModule(url, OrgUnit, TestModule);

	t.true(fetch.done());
});

test('updates module', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/root/'
	}, {
		body: [{
			Id: 1,
			Type: 0,
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<html></html>\n'
			}
		}]
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/modules/1') {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': 'application/json'
		});

		t.deepEqual(JSON.parse(options.body), {
			Id: 1,
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Content: '<html></html>\n',
				Type: 'Html'
			}
		});

		return true;
	}, {
		status: 200
	});

	class MockTopicProcessor {
		processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden = false }) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			if (topic.title === 'Test Topic') {
				t.deepEqual(topic, {
					title: 'Test Topic',
					type: 'topic',
					fileName: 'test-module/test-topic.md',
					isRequired: true
				});
				t.is(isHidden, false);
			} else {
				t.deepEqual(topic, {
					title: 'test-module/resource.txt',
					type: 'resource',
					fileName: 'test-module/resource.txt'
				});
				t.is(isHidden, true);
			}

			t.deepEqual(parentModule, {
				Id: 1,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	class MockQuizProcessor {
		processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(quiz, {
				title: 'Test Quiz',
				type: 'quiz'
			});
			t.deepEqual(parentModule, {
				Id: 1,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	const processor = new ModuleProcessor({ contentPath: ContentPath }, MockValence, fetch, MockTopicProcessor, MockQuizProcessor);

	await processor.processModule(url, OrgUnit, TestModule);

	t.true(fetch.done());
});

test('creates submodule', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/'
	}, {
		body: [{
			Id: 1,
			Type: 0,
			Title: 'Parent Module',
			ShortTitle: 'Parent Module',
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<html></html>\n'
			}
		}]
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/') {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': 'application/json'
		});

		t.deepEqual(JSON.parse(options.body), {
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Content: '<html></html>\n',
				Type: 'Html'
			}
		});

		return true;
	}, {
		Id: 2,
		Title: 'Test Module',
		ShortTitle: 'Test Module',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:00.000Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Html: '<html></html>\n'
		}
	});

	class MockTopicProcessor {
		processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden = false }) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			if (topic.title === 'Test Topic') {
				t.deepEqual(topic, {
					title: 'Test Topic',
					type: 'topic',
					fileName: 'test-module/test-topic.md',
					isRequired: true
				});
				t.is(isHidden, false);
			} else {
				t.deepEqual(topic, {
					title: 'test-module/resource.txt',
					type: 'resource',
					fileName: 'test-module/resource.txt'
				});
				t.is(isHidden, true);
			}

			t.deepEqual(parentModule, {
				Id: 2,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	class MockQuizProcessor {
		processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(quiz, {
				title: 'Test Quiz',
				type: 'quiz'
			});
			t.deepEqual(parentModule, {
				Id: 2,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	const processor = new ModuleProcessor({ contentPath: ContentPath }, MockValence, fetch, MockTopicProcessor, MockQuizProcessor);

	await processor.processModule(url, OrgUnit, TestModule, {
		Id: 1,
		Type: 0,
		Title: 'Parent Module',
		ShortTitle: 'Parent Module',
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:00.000Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Html: '<html></html>\n'
		}
	});

	t.true(fetch.done());
});

test('updates submodule', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/'
	}, {
		body: [{
			Id: 1,
			Type: 0,
			Title: 'Parent Module',
			ShortTitle: 'Parent Module',
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<html></html>\n'
			}
		}, {
			Id: 2,
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<html></html>\n'
			}
		}]
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/modules/2') {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': 'application/json'
		});

		t.deepEqual(JSON.parse(options.body), {
			Id: 2,
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: '2020-01-01T00:00:00.000Z',
			IsHidden: false,
			IsLocked: false,
			Description: {
				Content: '<html></html>\n',
				Type: 'Html'
			}
		});

		return true;
	}, {
		Id: 2,
		Title: 'Test Module',
		ShortTitle: 'Test Module',
		Type: 0,
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:00.000Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Html: '<html></html>\n'
		}
	});

	class MockTopicProcessor {
		processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden = false }) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			if (topic.title === 'Test Topic') {
				t.deepEqual(topic, {
					title: 'Test Topic',
					type: 'topic',
					fileName: 'test-module/test-topic.md',
					isRequired: true
				});
				t.is(isHidden, false);
			} else {
				t.deepEqual(topic, {
					title: 'test-module/resource.txt',
					type: 'resource',
					fileName: 'test-module/resource.txt'
				});
				t.is(isHidden, true);
			}

			t.deepEqual(parentModule, {
				Id: 2,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	class MockQuizProcessor {
		processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(quiz, {
				title: 'Test Quiz',
				type: 'quiz'
			});
			t.deepEqual(parentModule, {
				Id: 2,
				Title: 'Test Module',
				ShortTitle: 'Test Module',
				Type: 0,
				ModuleStartDate: null,
				ModuleEndDate: null,
				ModuleDueDate: '2020-01-01T00:00:00.000Z',
				IsHidden: false,
				IsLocked: false,
				Description: {
					Html: '<html></html>\n'
				}
			});
		}
	}

	const processor = new ModuleProcessor({ contentPath: ContentPath }, MockValence, fetch, MockTopicProcessor, MockQuizProcessor);

	await processor.processModule(url, OrgUnit, TestModule, {
		Id: 1,
		Type: 0,
		Title: 'Parent Module',
		ShortTitle: 'Parent Module',
		ModuleStartDate: null,
		ModuleEndDate: null,
		ModuleDueDate: '2020-01-01T00:00:00.000Z',
		IsHidden: false,
		IsLocked: false,
		Description: {
			Html: '<html></html>\n'
		}
	});

	t.true(fetch.done());
});

test('creates submodule, dryrun parentModule does not exist', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();

	class MockTopicProcessor {
		processTopic({ instanceUrl, orgUnit, topic, parentModule, isHidden = false }) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			if (topic.title === 'Test Topic') {
				t.deepEqual(topic, {
					title: 'Test Topic',
					type: 'topic',
					fileName: 'test-module/test-topic.md',
					isRequired: true
				});
				t.is(isHidden, false);
			} else {
				t.deepEqual(topic, {
					title: 'test-module/resource.txt',
					type: 'resource',
					fileName: 'test-module/resource.txt'
				});
				t.is(isHidden, true);
			}

			t.deepEqual(parentModule, DryRunFakeModule);
		}
	}

	class MockQuizProcessor {
		processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(quiz, {
				title: 'Test Quiz',
				type: 'quiz'
			});
			t.deepEqual(parentModule, DryRunFakeModule);
		}
	}

	const processor = new ModuleProcessor({ contentPath: ContentPath, isDryRun: true }, MockValence, fetch, MockTopicProcessor, MockQuizProcessor);

	await processor.processModule(url, OrgUnit, TestModule, DryRunFakeModule);

	t.true(fetch.done());
});
