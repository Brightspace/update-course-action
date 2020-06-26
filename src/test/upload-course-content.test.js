'use strict';

const path = require('path');

const test = require('ava');
const fetchMock = require('fetch-mock');

const FormData = require('form-data');
const UploadCourseContent = require('../upload-course-content');

const contentDirectory = path.join(__dirname, 'content');
const manifestPath = path.join(__dirname, 'content', '/manifest.json');

const MockValence = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

test('uploadCourseContent creates module, resource, and topic', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/users/whoami'
	}, {
		body: {
			UniqueName: 'Test User'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/courses/123'
	}, {
		body: {
			Identifier: '123',
			Name: 'Org Unit',
			Path: '/content/course123/'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/root/'
	}, {
		body: ''
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/root/') {
			return false;
		}

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
				Html: '<html></html>\n'
			}
		});

		return true;
	}, {
		Id: 1,
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
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/'
	}, {
		body: ''
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/') {
			return false;
		}

		const formdata = new FormData(options.body);
		if (!formdata.getBuffer().toString('utf-8').includes('test-topic.html')) {
			return false;
		}

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""\r\n'
			+ 'Content-Type: application/json\r\n\r\n'
			+ '{"Title":"Test Topic","ShortTitle":"Test Topic","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/test-topic.html","IsHidden":false,"IsLocked":false,"IsExempt":false}\r\n'
			+ `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""; filename="test-topic.html"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ '<h1></h1>\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		body: {
			Identifier: 2,
			Title: 'Test Topic',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false,
			Description: {
				Html: '<h1></h1>\n'
			}
		}
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/') {
			return false;
		}

		const formdata = new FormData(options.body);
		if (!formdata.getBuffer().toString('utf-8').includes('resource.txt')) {
			return false;
		}

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""\r\n'
			+ 'Content-Type: application/json\r\n\r\n'
			+ '{"Title":"test-module/resource.txt","ShortTitle":"test-module/resource.txt","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/resource.txt","IsHidden":true,"IsLocked":false,"IsExempt":true}\r\n'
			+ `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""; filename="resource.txt"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ 'ABC\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		body: {
			Identifier: 3,
			Title: 'test-module/resource.txt',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false
		}
	});

	const uploader = new UploadCourseContent({contentDirectory, manifestPath, isDryRun: false}, MockValence, fetch);

	await uploader.uploadCourseContent(url, 123);

	t.true(fetch.done());
});

test('uploadCourseContent skips creation on dry run', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/users/whoami'
	}, {
		body: {
			UniqueName: 'Test User'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/courses/123'
	}, {
		body: {
			Identifier: '123',
			Name: 'Org Unit',
			Path: '/content/course123/'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/root/'
	}, {
		body: ''
	});
	fetch.get({
		url: `https://example.com/d2l/api/le/1.34/123/content/modules/${UploadCourseContent.DRY_RUN_FAKE_MODULE.Id}/structure/`
	}, {
		body: ''
	});

	const uploader = new UploadCourseContent({contentDirectory, manifestPath, isDryRun: true}, MockValence, fetch);

	await uploader.uploadCourseContent(url, 123);

	t.true(fetch.done());
});

test('uploadCourseContent updates module, creates resource and topic', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/users/whoami'
	}, {
		body: {
			UniqueName: 'Test User'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/courses/123'
	}, {
		body: {
			Identifier: '123',
			Name: 'Org Unit',
			Path: '/content/course123/'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/root/'
	}, {
		body: [{
			Id: 1,
			Type: 0,
			Title: 'Test Module',
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: null,
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<h1></h1>\n'
			}
		}]
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/modules/1') {
			return false;
		}

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
				Html: '<html></html>\n'
			}
		});

		return true;
	}, {
		status: 200
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/'
	}, {
		body: ''
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/') {
			return false;
		}

		const formdata = new FormData(options.body);
		if (!formdata.getBuffer().toString('utf-8').includes('test-topic.html')) {
			return false;
		}

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""\r\n'
			+ 'Content-Type: application/json\r\n\r\n'
			+ '{"Title":"Test Topic","ShortTitle":"Test Topic","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/test-topic.html","IsHidden":false,"IsLocked":false,"IsExempt":false}\r\n'
			+ `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""; filename="test-topic.html"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ '<h1></h1>\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		body: {
			Identifier: 2,
			Title: 'Test Topic',
			ShortTitle: 'Test Topic',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false
		}
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/') {
			return false;
		}

		const formdata = new FormData(options.body);
		if (!formdata.getBuffer().toString('utf-8').includes('resource.txt')) {
			return false;
		}

		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""\r\n'
			+ 'Content-Type: application/json\r\n\r\n'
			+ '{"Title":"test-module/resource.txt","ShortTitle":"test-module/resource.txt","Type":1,"TopicType":1,"StartDate":null,"EndDate":null,"DueDate":null,"Url":"/content/course123/test-module/resource.txt","IsHidden":true,"IsLocked":false,"IsExempt":true}\r\n'
			+ `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name=""; filename="resource.txt"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ 'ABC\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		body: {
			Identifier: 3,
			Title: 'test-module/resource.txt',
			ShortTitle: 'test-module/resource.txt',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: true,
			OpenAsExternalResource: false
		}
	});

	const uploader = new UploadCourseContent({contentDirectory, manifestPath, isDryRun: false}, MockValence, fetch);

	await uploader.uploadCourseContent(url, 123);

	t.true(fetch.done());
});

test('uploadCourseContent updates module, resource, and topic', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/users/whoami'
	}, {
		body: {
			UniqueName: 'Test User'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/courses/123'
	}, {
		body: {
			Identifier: '123',
			Name: 'Org Unit',
			Path: '/content/course123/'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/root/'
	}, {
		body: [{
			Id: 1,
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: null,
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<h2></h2>\n'
			}
		}]
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/modules/1') {
			return false;
		}

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
				Html: '<html></html>\n'
			}
		});

		return true;
	}, {
		status: 200
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/'
	}, {
		body: [{
			Identifier: 2,
			Title: 'Test Topic',
			ShortTitle: 'Test Topic',
			Type: 1,
			TopicType: 1,
			DueDate: null,
			StartDate: null,
			EndDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false
		}, {
			Identifier: 3,
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
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/topics/2') {
			return false;
		}

		t.deepEqual(JSON.parse(options.body), {
			Identifier: 2,
			Title: 'Test Topic',
			ShortTitle: 'Test Topic',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false,
			ResetCompletionTracking: true,
			Url: '/content/course123/test-module/test-topic.html'
		});

		return true;
	}, {
		body: {
			Identifier: 2,
			Title: 'Test Topic',
			Type: 1,
			TopicType: 1,
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false
		}
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/topics/2/file') {
			return false;
		}

		const formdata = new FormData(options.body);
		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name="file"; filename="test-topic.html"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ '<h1></h1>\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		status: 200
	});
	fetch.put((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/topics/3') {
			return false;
		}

		if (!options.body.includes('resource.txt')) {
			return false;
		}

		t.deepEqual(JSON.parse(options.body), {
			Identifier: 3,
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
			Identifier: 3,
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
		if (url !== 'https://example.com/d2l/api/le/1.34/123/content/topics/3/file') {
			return false;
		}

		const formdata = new FormData(options.body);
		t.is(formdata.getBuffer().toString('utf-8'), `--${formdata.getBoundary()}\r\n`
			+ 'Content-Disposition: form-data; name="file"; filename="resource.txt"\r\n'
			+ 'Content-Type: text/html\r\n\r\n'
			+ 'ABC\n\r\n'
			+ `--${formdata.getBoundary()}--\r\n`);

		return true;
	}, {
		status: 200
	});

	const uploader = new UploadCourseContent({contentDirectory, manifestPath, isDryRun: false}, MockValence, fetch);

	await uploader.uploadCourseContent(url, 123);

	t.true(fetch.done());
});

test('uploadCourseContent skips updates on dry run', async t => {
	const url = new URL('https://example.com');

	const fetch = fetchMock.sandbox();
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/users/whoami'
	}, {
		body: {
			UniqueName: 'Test User'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/lp/1.23/courses/123'
	}, {
		body: {
			Identifier: '123',
			Name: 'Org Unit',
			Path: '/content/course123/'
		}
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/root/'
	}, {
		body: [{
			Id: 1,
			Title: 'Test Module',
			ShortTitle: 'Test Module',
			Type: 0,
			ModuleStartDate: null,
			ModuleEndDate: null,
			ModuleDueDate: null,
			IsHidden: false,
			IsLocked: false,
			Description: {
				Html: '<h2></h2>\n'
			}
		}]
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.34/123/content/modules/1/structure/'
	}, {
		body: [{
			Identifier: 2,
			Title: 'Test Topic',
			ShortTitle: 'Test Topic',
			Type: 1,
			TopicType: 1,
			DueDate: null,
			StartDate: null,
			EndDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false
		}, {
			Identifier: 3,
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

	const uploader = new UploadCourseContent({contentDirectory, manifestPath, isDryRun: true}, MockValence, fetch);

	await uploader.uploadCourseContent(url, 123);

	t.true(fetch.done());
});
