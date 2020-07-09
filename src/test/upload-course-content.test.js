'use strict';

const path = require('path');
const test = require('ava');
const fetchMock = require('fetch-mock');

const UploadCourseContent = require('../upload-course-content');

const ContentPath = path.join(__dirname, 'content');
const ManifestPath = path.join(__dirname, 'content/manifest.json');

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

test('uploadCourseContent processes module', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.26/users/whoami'
	}, {
		body: {
			UniqueName: 'Test User'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.26/courses/123'
	}, {
		body: {
			Identifier: '123',
			Name: 'Org Unit',
			Path: '/content/course123/'
		}
	});

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
				Id: '1'
			}];
		}
	}

	const uploader = new UploadCourseContent({ contentDirectory: ContentPath, manifestPath: ManifestPath }, MockValence, fetch, MockModuleProcessor);

	const structure = await uploader.uploadCourseContent(url, 123);

	t.deepEqual(structure, [{
		Id: '1'
	}]);
	t.true(fetch.done());
});
