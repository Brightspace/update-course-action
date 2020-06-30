'use strict';

const path = require('path');
const test = require('ava');
const FormData = require('form-data');
const fetchMock = require('fetch-mock');

const TopicProcessor = require('../../utility/topic-processor');

const ContentPath = path.join(__dirname, '..', 'content');

const MockValence = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

const OrgUnit = {
	Identifier: 123,
	Name: 'Org Unit',
	Path: '/content/course123/'
};

const ParentModule = {
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
};

test('creates topic', async t => {
	const url = new URL('https://example.com');
	const fetch = fetchMock.sandbox();

	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/'
	}, {
		body: ''
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/') {
			return false;
		}

		const formdata = new FormData(options.body);
		if (!formdata.getBuffer().toString('utf-8').includes('test-topic.html')) {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': `multipart/mixed; boundary=${formdata.getBoundary()}`
		});

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""\r\n'
			+ 'Content-Type: application/json\r\n\r\n'
			+ '{"Title":"Test Topic","ShortTitle":"Test Topic","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/test-topic.html","IsHidden":false,"IsLocked":false,"IsExempt":true}\r\n'
			+ `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""; filename="test-topic.html"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ '<h1></h1>\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		body: {
			Id: 2,
			Title: 'Test Topic',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false,
			Description: {
				Html: '<h1></h1>\n'
			}
		}
	});

	const topic = {
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md'
	};

	const processor = new TopicProcessor({ contentPath: ContentPath }, MockValence, fetch);
	await processor.processTopic({ instanceUrl: url, orgUnit: OrgUnit, topic, parentModule: ParentModule, isHidden: false });

	t.true(fetch.done());
});

test('creates hidden topic', async t => {
	const url = new URL('https://example.com');
	const fetch = fetchMock.sandbox();

	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/'
	}, {
		body: ''
	});

	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/') {
			return false;
		}

		const formdata = new FormData(options.body);
		if (!formdata.getBuffer().toString('utf-8').includes('resource.txt')) {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': `multipart/mixed; boundary=${formdata.getBoundary()}`
		});

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""\r\n'
			+ 'Content-Type: application/json\r\n\r\n'
			+ '{"Title":"test-module/resource.txt","ShortTitle":"test-module/resource.txt","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/resource.txt","IsHidden":true,"IsLocked":false,"IsExempt":true}\r\n'
			+ `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""; filename="resource.txt"\r\n'
			+ 'Content-Type: text/plain\r\n\r\n'
			+ 'ABC\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		body: {
			Id: 3,
			Title: 'test-module/resource.txt',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: true,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false
		}
	});

	const topic = {
		title: 'test-module/resource.txt',
		type: 'resource',
		fileName: 'test-module/resource.txt'
	};

	const processor = new TopicProcessor({ contentPath: ContentPath }, MockValence, fetch);
	await processor.processTopic({ instanceUrl: url, orgUnit: OrgUnit, topic, parentModule: ParentModule, isHidden: true });

	t.true(fetch.done());
});

test('updates topic', async t => {
	const url = new URL('https://example.com');
	const fetch = fetchMock.sandbox();

	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/'
	}, {
		body: [{
			Id: 2,
			Title: 'Test Topic',
			ShortTitle: 'Test Topic',
			Type: 1,
			TopicType: 1,
			DueDate: null,
			StartDate: null,
			EndDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false
		}]
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/topics/2') {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': 'application/json'
		});

		t.deepEqual(JSON.parse(options.body), {
			Id: 2,
			Title: 'Test Topic',
			ShortTitle: 'Test Topic',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false,
			ResetCompletionTracking: true,
			Url: '/content/course123/test-module/test-topic.html'
		});

		return true;
	}, {
		status: 200
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/topics/2/file') {
			return false;
		}

		const formdata = new FormData(options.body);

		t.deepEqual(options.headers, {
			'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`
		});

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name="file"; filename="test-topic.html"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ '<h1></h1>\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		status: 200
	});

	const topic = {
		title: 'Test Topic',
		type: 'topic',
		fileName: 'test-module/test-topic.md'
	};

	const processor = new TopicProcessor({ contentPath: ContentPath }, MockValence, fetch);
	await processor.processTopic({ instanceUrl: url, orgUnit: OrgUnit, topic, parentModule: ParentModule, isHidden: false });

	t.true(fetch.done());
});

test('updates hidden topic', async t => {
	const url = new URL('https://example.com');
	const fetch = fetchMock.sandbox();

	fetch.get({
		url: 'https://example.com/d2l/api/le/1.44/123/content/modules/1/structure/'
	}, {
		body: [{
			Id: 3,
			Title: 'test-module/resource.txt',
			ShortTitle: 'test-module/resource.txt',
			Type: 1,
			TopicType: 1,
			DueDate: null,
			StartDate: null,
			EndDate: null,
			IsHidden: true,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false
		}]
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/topics/3') {
			return false;
		}

		if (!options.body.includes('resource.txt')) {
			return false;
		}

		t.deepEqual(options.headers, {
			'Content-Type': 'application/json'
		});

		t.deepEqual(JSON.parse(options.body), {
			Id: 3,
			Title: 'test-module/resource.txt',
			ShortTitle: 'test-module/resource.txt',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: true,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false,
			ResetCompletionTracking: true,
			Url: '/content/course123/test-module/resource.txt'
		});

		return true;
	}, {
		body: {
			Id: 3,
			Title: 'test-module/resource.txt',
			ShortTitle: 'test-module/resource.txt',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: true,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false
		}
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.44/123/content/topics/3/file') {
			return false;
		}

		const formdata = new FormData(options.body);

		t.deepEqual(options.headers, {
			'Content-Type': `multipart/form-data; boundary=${formdata.getBoundary()}`
		});

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name="file"; filename="resource.txt"\r\n'
			+ 'Content-Type: text/plain\r\n\r\n'
			+ 'ABC\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		status: 200
	});

	const topic = {
		title: 'test-module/resource.txt',
		type: 'resource',
		fileName: 'test-module/resource.txt'
	};

	const processor = new TopicProcessor({ contentPath: ContentPath }, MockValence, fetch);
	await processor.processTopic({ instanceUrl: url, orgUnit: OrgUnit, topic, parentModule: ParentModule, isHidden: false });

	t.true(fetch.done());
});
