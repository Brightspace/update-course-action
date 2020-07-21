'use strict';

const path = require('path');
const test = require('ava');

const UploadCourseContent = require('../upload-course-content');
const FileHandler = require('../utility/file-handler');

const ContentPath = path.join(__dirname, 'content');
const ManifestPath = path.join(__dirname, 'content/manifest.json');

const OrgUnit = {
	Identifier: '123',
	Name: 'Org Unit',
	Path: '/content/course123/'
};

const User = {
	UniqueName: 'Test User'
};

const ValenceApiMock = {
	getOrgUnit: async () => {
		return OrgUnit;
	},
	whoAmI: async () => {
		return User;
	}
};

test('uploadCourseContent processes module', async t => {
	class MockModuleProcessor {
		processModule(instanceUrl, orgUnit, module) {
			t.is(instanceUrl.toString(), 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(module, {
				title: 'Test Module',
				type: 'module',
				descriptionFileName: 'test-module/index.md',
				dueDate: '2020-01-01T00:00:00.000Z',
				children: [{
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
				}]
			});

			return [{
				id: 1,
				title: 'Test Module',
				type: 'module',
				descriptionFileName: 'test-module/index.md',
				dueDate: '2020-01-01T00:00:00.000Z'
			},
			{
				id: 2,
				title: 'Test Topic',
				type: 'topic',
				fileName: 'test-module/test-topic.md',
				isRequired: true
			},
			{
				id: 3,
				title: 'Test Quiz',
				type: 'quiz'
			},
			{
				id: 4,
				type: 'resource',
				fileName: 'test-module/resource.txt'
			}];
		}
	}

	const fileHandler = new FileHandler(ContentPath);
	const uploader = new UploadCourseContent(ManifestPath, fileHandler, ValenceApiMock, MockModuleProcessor);

	const response = await uploader.uploadCourseContent('https://example.com/', 123);

	t.deepEqual(response, [{
		id: 1,
		title: 'Test Module',
		type: 'module',
		descriptionFileName: 'test-module/index.md',
		dueDate: '2020-01-01T00:00:00.000Z'
	},
	{
		id: 2,
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md',
		isRequired: true
	},
	{
		id: 3,
		title: 'Test Quiz',
		type: 'quiz'
	},
	{
		id: 4,
		type: 'resource',
		fileName: 'test-module/resource.txt'
	}]);
});
