'use strict';

const path = require('path');
const test = require('ava');

const Processor = require('../../utility/processor');
const FileHandler = require('../../utility/file-handler');

const ContentPath = path.join(__dirname, '..', 'content');

const OrgUnit = {
	Identifier: '123',
	Name: 'Org Unit',
	Path: '/content/course123/'
};

const TestModule = {
	title: 'Test Module',
	type: 'module',
	descriptionFileName: 'test-module/index.html',
	dueDate: '2020-01-01T00:00:00.000Z',
	children: [
		{
			title: 'Test Topic',
			type: 'topic',
			fileName: 'test-module/test-topic.html',
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

test('asserts module', async t => {
	const MockValenceApi = {
		assertModule: async (instanceUrl, orgUnit, module, parentModule) => {
			t.is(instanceUrl, 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(module, TestModule);
			t.is(parentModule, null);

			return {
				title: module.title,
				type: 'module',
				description: '<html></html>\n',
				descriptionFileName: 'test-module/index.html',
				dueDate: module.dueDate,
				id: 1
			};
		},
		assertTopic: async (instanceUrl, orgUnit, { module, topic, data }) => {
			t.is(instanceUrl, 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(module, {
				title: 'Test Module',
				type: 'module',
				description: '<html></html>\n',
				descriptionFileName: 'test-module/index.html',
				dueDate: '2020-01-01T00:00:00.000Z',
				id: 1
			});

			if (topic.type === 'topic') {
				t.deepEqual(topic, {
					title: 'Test Topic',
					type: 'topic',
					fileName: 'test-module/test-topic.html',
					isRequired: true
				});
				t.is(data, '<h1></h1>\n');

				return {
					...topic,
					id: 2
				};
			}

			if (topic.type === 'resource') {
				t.deepEqual(topic, {
					title: 'test-module/resource.txt',
					type: 'resource',
					fileName: 'test-module/resource.txt'
				});

				return {
					...topic,
					id: 4
				};
			}
		},
		assertQuiz: async (instanceUrl, orgUnit, quiz, module) => {
			t.is(instanceUrl, 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(module, {
				title: 'Test Module',
				type: 'module',
				description: '<html></html>\n',
				descriptionFileName: 'test-module/index.html',
				dueDate: '2020-01-01T00:00:00.000Z',
				id: 1
			});
			t.deepEqual(quiz, {
				title: 'Test Quiz',
				type: 'quiz'
			});

			return {
				...quiz,
				id: 3
			};
		}
	};

	const fileHandler = new FileHandler(ContentPath);
	const processor = new Processor(fileHandler, MockValenceApi);

	const results = await processor.processModule('https://example.com/', OrgUnit, TestModule);

	t.deepEqual(results, [{
		id: 1,
		title: 'Test Module',
		type: 'module',
		description: '<html></html>\n',
		descriptionFileName: 'test-module/index.html',
		dueDate: '2020-01-01T00:00:00.000Z'
	}, {
		id: 2,
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.html',
		isRequired: true
	}, {
		id: 3,
		title: 'Test Quiz',
		type: 'quiz'
	}, {
		id: 4,
		title: 'test-module/resource.txt',
		type: 'resource',
		fileName: 'test-module/resource.txt'
	}]);
});
