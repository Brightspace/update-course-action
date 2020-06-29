'use strict';

const { DryRunFakeModule, LEVersion } = require('../constants');
const ContentFactory = require('./content-factory');

module.exports = class QuizProcessor {
	constructor(
		{ isDryRun = false },
		valence,
		fetch = require('node-fetch')
	) {
		this._dryRun = isDryRun;

		this._fetch = fetch;
		this._valence = valence;
	}

	async processQuiz(instanceUrl, orgUnit, quiz, parentModule) {
		const content = await this._getContent(instanceUrl, orgUnit, parentModule);
		const self = Array.isArray(content) && content.find(x => x.Type === 1 && x.TopicType === 3 && x.Title === quiz.title);

		if (self) {
			// Nothing to do, the quicklink exists
			return self;
		}

		const quizzes = await this._getQuizzes(instanceUrl, orgUnit);
		const quizItem = quizzes.Objects && Array.isArray(quizzes.Objects) && quizzes.Objects.find(x => x.Name === quiz.title);

		return this._createQuizTopic({ instanceUrl, orgUnit, quiz, parentModule, quizItem });
	}

	async _createQuizTopic({ instanceUrl, orgUnit, quiz, parentModule, quizItem }) {
		console.log(`Creating quiz topic: '${quiz.title}'`);

		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'POST');

		const rcode = quizItem.ActivityId.split('/').slice(-1)[0];
		const topic = ContentFactory.createTopic({
			title: quiz.title,
			topicType: 3,
			url: `/d2l/common/dialogs/quickLink/quickLink.d2l?ou=${orgUnit.Identifier}&type=quiz&rcode=${rcode}`,
			isExempt: !quiz.isRequired
		});

		if (this._dryRun) {
			return {};
		}

		const response = await this._fetch(
			signedUrl,
			{
				method: 'POST',
				body: JSON.stringify(topic)
			}
		);

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}

	async _getContent(instanceUrl, orgUnit, parentModule) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/content/modules/${parentModule.Id}/structure/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		if (this._dryRun && parentModule.Id === DryRunFakeModule.Id) {
			return DryRunFakeModule;
		}

		const response = await this._fetch(signedUrl);

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}

	async _getQuizzes(instanceUrl, orgUnit) {
		const url = new URL(`/d2l/api/le/${LEVersion}/${orgUnit.Identifier}/quizzes/`, instanceUrl);
		const signedUrl = this._valence.createAuthenticatedUrl(url, 'GET');

		const response = await this._fetch(signedUrl);

		if (!response.ok) {
			throw new Error(response.statusText);
		}

		return response.json();
	}
};
