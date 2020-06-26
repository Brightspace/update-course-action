'use strict';

const test = require('ava');
const fetchMock = require('fetch-mock');

const QuizProcessor = require('../../utility/quiz-processor');

const MockValence = {
	createAuthenticatedUrl(url) {
		return url;
	}
};

const OrgUnit = {
	Id: 123,
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

test('creates quiz topic', async t => {
	const url = new URL('https://example.com');
	const fetch = fetchMock.sandbox();

	fetch.get({
		url: 'https://example.com/d2l/api/le/1.46/123/quizzes/'
	}, {
		Objects: [{
			QuizId: 1,
			Name: 'Test Quiz',
			ActivityId: 'https://ids.brightspace.com/activities/quiz/Dev-1'
		}]
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.46/123/content/modules/1/structure/'
	}, {
		body: []
	});
	fetch.post((url, options) => {
		if (url !== 'https://example.com/d2l/api/le/1.46/123/content/modules/1/structure/') {
			return false;
		}

		t.deepEqual(JSON.parse(options.body), {
			Title: 'Test Quiz',
			ShortTitle: 'Test Quiz',
			Type: 1,
			TopicType: 3,
			Url: '/d2l/common/dialogs/quickLink/quickLink.d2l?ou=123&type=quiz&rcode=Dev-1',
			StartDate: null,
			EndDate: null,
			DueDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false
		});

		return true;
	}, {
		body: {
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
			IsExempt: false,
			OpenAsExternalResource: false
		}
	});

	const quiz = {
		title: 'Test Quiz',
		type: 'quiz'
	};

	const processor = new QuizProcessor({}, MockValence, fetch);
	await processor.processQuiz(url, OrgUnit, quiz, ParentModule);

	t.true(fetch.done());
});

test('noop on existing quiz topic', async t => {
	const url = new URL('https://example.com');
	const fetch = fetchMock.sandbox();

	fetch.get({
		url: 'https://example.com/d2l/api/le/1.46/123/quizzes/'
	}, {
		Objects: [{
			QuizId: 1,
			Name: 'Test Quiz',
			ActivityId: 'https://ids.brightspace.com/activities/quiz/Dev-1'
		}]
	});
	fetch.get({
		url: 'https://example.com/d2l/api/le/1.46/123/content/modules/1/structure/'
	}, {
		body: [{
			Id: 3,
			Title: 'Test Quiz',
			ShortTitle: 'Test Quiz',
			Type: 1,
			TopicType: 3,
			DueDate: null,
			StartDate: null,
			EndDate: null,
			IsHidden: false,
			IsLocked: false,
			IsExempt: false,
			OpenAsExternalResource: false
		}]
	});

	const quiz = {
		title: 'Test Quiz',
		type: 'quiz'
	};

	const processor = new QuizProcessor({}, MockValence, fetch);
	await processor.processQuiz(url, OrgUnit, quiz, ParentModule);

	t.true(fetch.done());
});
