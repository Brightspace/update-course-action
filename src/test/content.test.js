'use strict';

const test = require('ava');
const path = require('path');

const Content = require('../content');

test('readManifest returns manifest', async t => {
	const content = new Content({
		rootPath: path.join(__dirname, './data/emptyManifest')
	});
	const result = await content.readManifest();
	t.is(result, '{\r\n\t"modules": []\r\n}');
});

test('readManifest throws on missing manifest', async t => {
	const content = new Content({
		rootPath: path.join(__dirname, './data/missingManifest')
	});
	await t.throwsAsync(async () => {
		await content.readManifest();
	});
});

test('readManifest throws on missing directory', async t => {
	const content = new Content({
		rootPath: path.join(__dirname, './data/directoryThatDoesntExist')
	});
	await t.throwsAsync(async () => {
		await content.readManifest();
	});
});
