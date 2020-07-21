'use strict';

const test = require('ava');
const mockFs = require('mock-fs');

const FileHandler = require('../../utility/file-handler');

const pngTestValue = Buffer.from([8, 6, 7, 5, 3, 0, 9]);
const htmlTestValue = '<html></html>';

mockFs({
	'content/module/test.html': htmlTestValue,
	'content/test.md': '# Markdown!',
	'content/test2.md': '# Markdown!\n<b>Now with more HTML</b>',
	'content/image.png': pngTestValue
});
test.after(mockFs.restore);

test('throws on NotFound', async t => {
	const handler = new FileHandler('content');
	await t.throwsAsync(async () => {
		await handler.getContent('fileDoesntExist.txt');
	});
});

test('fetches html', async t => {
	const handler = new FileHandler('content');
	const info = await handler.getContent('module/test.html');
	t.is(info.toString('utf-8'), htmlTestValue);
});

test('fetches binary data', async t => {
	const handler = new FileHandler('content');
	const info = await handler.getContent('image.png');
	t.deepEqual(info, pngTestValue);
});

test('renders markdown', async t => {
	const handler = new FileHandler('content');
	const info = await handler.getContent('test.md');
	t.is(info.toString('utf-8'), '<h1 id="markdown">Markdown!</h1>\n');
});

test('renders html and markdown together', async t => {
	const handler = new FileHandler('content');
	const info = await handler.getContent('test2.md');
	t.is(info.toString('utf-8'), '<h1 id="markdown">Markdown!</h1>\n<p><b>Now with more HTML</b></p>\n');
});

