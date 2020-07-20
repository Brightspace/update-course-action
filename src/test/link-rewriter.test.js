'use strict';

const test = require('ava');
const mockFs = require('mock-fs');

const LinkRewriter = require('../link-rewriter');
const FileHandler = require('../utility/file-handler');

test.afterEach(() => {
	mockFs.restore();
});

const OrgUnit = {
	Identifier: '123',
	Name: 'Org Unit',
	Path: '/content/course123/'
};

test.serial('rewriteLinks updates module link to topic', async t => {
	mockFs({
		'/testdata/module1/index.html': '<html><body><a href="module1/topic1.md">Topic 1</a></body></html>',
		'/testdata/module1/topic1.md': '<html><body><p>Content</p></body></html>'
	});

	const manifest = [{
		id: 1,
		title: 'Module 1',
		type: 'module',
		descriptionFileName: 'module1/index.html'
	}, {
		id: 2,
		title: 'Topic 1',
		type: 'topic',
		fileName: 'module1/topic1.md'
	}];

	const MockValenceApi = {
		getOrgUnit: () => OrgUnit,
		assertTopic: () => {
			t.fail();
		},
		assertModule: (instanceUrl, orgUnit, module, parentModule = null) => {
			t.is(instanceUrl, 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.is(parentModule, null);
			t.deepEqual(module, {
				...manifest[0],
				description: '<html><head></head><body><a href="/d2l/le/lessons/123/topics/2" target="_parent">Topic 1</a></body></html>'
			});
		}
	};
	const fileHandler = new FileHandler('/testdata', mockFs);
	const rewriter = new LinkRewriter(fileHandler, MockValenceApi);

	await rewriter.rewriteLinks('https://example.com/', OrgUnit, manifest);
});

test.serial('rewriteLinks updates topic link to module', async t => {
	mockFs({
		'/testdata/module1/index.html': '<html><body><p>Content</p></body></html>',
		'/testdata/module1/topic1.html': '<html><body><a href="module1/index.html">Module 1</a></body></html>'
	});

	const manifest = [{
		id: 1,
		title: 'Module 1',
		type: 'module',
		descriptionFileName: 'module1/index.html'
	}, {
		id: 2,
		title: 'Topic 1',
		type: 'topic',
		fileName: 'module1/topic1.html',
		parent: { id: 1, title: 'Module 1', type: 'module', descriptionFileName: 'module1/index.html' }
	}];

	const MockValenceApi = {
		getOrgUnit: () => OrgUnit,
		assertModule: () => {
			t.fail();
		},
		assertTopic: (instanceUrl, orgUnit, { module, topic, data }) => {
			t.is(instanceUrl, 'https://example.com/');
			t.deepEqual(orgUnit, OrgUnit);
			t.deepEqual(module, { id: 1, title: 'Module 1', type: 'module', descriptionFileName: 'module1/index.html' });
			t.deepEqual(topic, manifest[1]);
			t.is(data, '<html><head></head><body><a href="/d2l/le/lessons/123/units/1" target="_parent">Module 1</a></body></html>');
		}
	};

	const fileHandler = new FileHandler('/testdata', mockFs);
	const rewriter = new LinkRewriter(fileHandler, MockValenceApi);

	await rewriter.rewriteLinks('https://example.com/', OrgUnit, manifest);
});
