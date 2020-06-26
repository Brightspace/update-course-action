'use strict';

const test = require('ava');
const Validator = require('../validator');

class MockCore {
	constructor(input) {
		this._input = input;
	}

	getInput(name) {
		return this._input[name];
	}
}

test('valenceInput is required', t => {
	const core = new MockCore({});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getValenceInput();
	});
});

test('valenceInput returns values', t => {
	const core = new MockCore({valenceAppId: '123', valenceAppKey: '234', valenceUserId: '345', valenceUserKey: '456'});
	const validator = new Validator(core);
	t.deepEqual({appId: '123', appKey: '234', userId: '345', userKey: '456'}, validator.getValenceInput());
});

test('isDryRun is required', t => {
	const core = new MockCore({});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getIsDryRun();
	});
});

test('isDryRun must be boolean', t => {
	const core = new MockCore({dryRun: 'yea'});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getIsDryRun();
	});
});

test('isDryRun returns the value', t => {
	const core = new MockCore({dryRun: 'false'});
	const validator = new Validator(core);
	t.is(false, validator.getIsDryRun());
});

test('manifestPath is required', t => {
	const core = new MockCore({});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getManifestPath();
	});
});

test('manifestPath is must be a path to a .json file', t => {
	const core = new MockCore({manifestPath: 'content'});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getManifestPath();
	});
});

test('manifestPath returns the value', t => {
	const core = new MockCore({manifestPath: 'content/manifest.json'});
	const validator = new Validator(core);
	t.is('content/manifest.json', validator.getManifestPath());
});

test('contentDirectory is required', t => {
	const core = new MockCore({});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getContentDirectory();
	});
});

test('contentDirectory returns the value', t => {
	const core = new MockCore({contentDirectory: 'content'});
	const validator = new Validator(core);
	t.is('content', validator.getContentDirectory());
});

test('instanceDomain is required', t => {
	const core = new MockCore({});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getInstanceDomain();
	});
});

test('instanceDomain must be a URL', t => {
	const core = new MockCore({instanceDomain: 'not a domain'});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getInstanceDomain();
	});
});

test('instanceDomain returns the value', t => {
	const core = new MockCore({instanceDomain: 'example.com'});
	const validator = new Validator(core);
	t.deepEqual(new URL('https://example.com'), validator.getInstanceDomain());
});

test('courseOrgUnitId is required', t => {
	const core = new MockCore({});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getCourseOrgUnitId();
	});
});

test('courseOrgUnitId must be an integer', t => {
	const core = new MockCore({courseOrgUnitId: 'test'});
	const validator = new Validator(core);
	t.throws(() => {
		validator.getCourseOrgUnitId();
	});
});

test('courseOrgUnitId returns the value', t => {
	const core = new MockCore({courseOrgUnitId: '123'});
	const validator = new Validator(core);
	t.is(123, validator.getCourseOrgUnitId());
});
