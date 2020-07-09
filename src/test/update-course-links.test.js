'use strict';

const path = require('path');
const test = require('ava');
const fetchMock = require('fetch-mock');
const parser = require('parse5');

const CourseLinkUpdater = require('../update-course-links');

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

test('_findInManifest finds topic in module', t => {
	const manifest = {
		modules: [{
			title: 'module1',
			children: [{
				title: 'topic1'
			}]
		}]
	};

	class MockModuleProcessor { }

	const fetch = fetchMock.sandbox();

	const processor = new CourseLinkUpdater({ contentDirectory: ContentPath, manifestPath: ManifestPath }, MockValence, fetch, MockModuleProcessor);

	const result = processor._findInManifest(x => x.title === 'topic1', manifest);

	t.deepEqual(result, {
		title: 'topic1'
	});
});

test('_findInManifest finds topic in submodule', t => {
	const manifest = {
		modules: [{
			title: 'module1',
			children: [{
				title: 'module2',
				children: [{
					title: 'topic1'
				}]
			}]
		}]
	};

	class MockModuleProcessor { }

	const fetch = fetchMock.sandbox();

	const processor = new CourseLinkUpdater({ contentDirectory: ContentPath, manifestPath: ManifestPath }, MockValence, fetch, MockModuleProcessor);

	const result = processor._findInManifest(x => x.title === 'topic1', manifest);

	t.deepEqual(result, {
		title: 'topic1'
	});
});

test('_findInManifest finds module in manifest', t => {
	const manifest = {
		modules: [{
			title: 'module1'
		}]
	};

	class MockModuleProcessor { }

	const fetch = fetchMock.sandbox();

	const processor = new CourseLinkUpdater({ contentDirectory: ContentPath, manifestPath: ManifestPath }, MockValence, fetch, MockModuleProcessor);

	const result = processor._findInManifest(x => x.title === 'module1', manifest);

	t.deepEqual(result, {
		title: 'module1'
	});
});

test('_getAllLinks returns all links in document', t => {
	const document = '<html><body><p>Text <a href="link.html">Link</a></p></body></html';

	class MockModuleProcessor { }

	const fetch = fetchMock.sandbox();

	const processor = new CourseLinkUpdater({ contentDirectory: ContentPath, manifestPath: ManifestPath }, MockValence, fetch, MockModuleProcessor);

	const links = processor._getAllLinks(parser.parse(document));

	for (const link of links) {
		t.truthy(link.attrs.find(x => x.name === 'href'));
	}
});

test('updateLinks updates the links', async t => {
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

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.26/courses/123'
	}, OrgUnit);

	const processor = new CourseLinkUpdater({ contentDirectory: ContentPath, manifestPath: ManifestPath }, MockValence, fetch, MockModuleProcessor);

	await processor.updateLinks('https://example.com/', 123, [{
		Id: 1,
		Title: 'Test Module',
		Type: 0
	}, {
		Id: 2,
		Title: 'Test Topic',
		Type: 1
	}, {
		Id: 3,
		Title: 'Test Quiz',
		Type: 1
	}]);
});
