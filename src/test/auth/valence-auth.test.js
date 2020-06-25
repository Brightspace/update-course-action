'use strict';

const test = require('ava');

const ValenceAuth = require('../../auth/valence-auth');

test('createAuthenticatedUrl returns a signed url', t => {
	const auth = new ValenceAuth({
		appId: 'foo', appKey: 'bar', userId: 'baz', userKey: 'quux'
	});

	auth._getTimestamp = () => {
		return 1397958932;
	};

	const url = auth.createAuthenticatedUrl(
		new URL('/d2l/api/lp/1.0/users/whoami?abc=xyz', 'http://somelms.edu'),
		'GET'
	);

	t.is(url.host, 'somelms.edu');
	t.is(url.pathname, '/d2l/api/lp/1.0/users/whoami');
	t.is(url.protocol, 'http:');

	const searchParameters = url.searchParams;
	t.is(searchParameters.get('abc'), 'xyz');
	t.is(searchParameters.get('x_a'), 'foo');
	t.is(searchParameters.get('x_b'), 'baz');
	t.is(searchParameters.get('x_c'), 'eInA7Qr4HYQn8b8x6RoMPioxftBYbRsa3oiIFCZFTgU');
	t.is(searchParameters.get('x_d'), 'fkpwBDGOppT6DrsjJNxcsxFIaGo-RS3q3kmeJBwemc0');
	t.is(searchParameters.get('x_t'), '1397958932');
});

test('createAuthenticatedUrl should not include query parameters in signature', t => {
	const auth = new ValenceAuth({
		appId: 'foo', appKey: 'bar', userId: 'baz', userKey: 'quux'
	});

	const urlWithParameters = auth.createAuthenticatedUrl(
		new URL('/d2l/api/lp/1.0/users/whoami?abc=xyz', 'http://somelms.edu'),
		'GET'
	);

	const urlWithoutParameters = auth.createAuthenticatedUrl(
		new URL('/d2l/api/lp/1.0/users/whoami', 'http://somelms.edu'),
		'GET'
	);

	t.is(urlWithParameters.searchParams.get('x_c'), urlWithoutParameters.searchParams.get('x_c'));
	t.is(urlWithParameters.searchParams.get('x_d'), urlWithoutParameters.searchParams.get('x_d'));
});

test('_getTimestamp returns current unix timestamp', t => {
	const auth = new ValenceAuth({
		appId: 'foo', appKey: 'bar', userId: 'baz', userKey: 'quux'
	});

	const timestamp = auth._getTimestamp();

	t.is(timestamp, Math.round(Date.now() / 1000));
});

test('_getTokenUrl with standard port returns token url without port', t => {
	const url = ValenceAuth._getTokenUrl(
		new URL('/api/command', 'https://example.com:443'),
		{
			x_a: 'appId',
			x_b: 'userId',
			x_c: 'appSignature',
			x_d: 'userSignature',
			x_t: 123456
		});

	t.is(url.host, 'example.com');
	t.is(url.pathname, '/api/command');
	t.is(url.protocol, 'https:');

	const searchParameters = url.searchParams;
	t.is(searchParameters.get('x_a'), 'appId');
	t.is(searchParameters.get('x_b'), 'userId');
	t.is(searchParameters.get('x_c'), 'appSignature');
	t.is(searchParameters.get('x_d'), 'userSignature');
	t.is(searchParameters.get('x_t'), '123456');
});

test('_getTokenUrl with non-standard port returns token url with port', t => {
	const url = ValenceAuth._getTokenUrl(
		new URL('/api/command', 'https://example.com:8443'),
		{
			x_a: 'appId',
			x_b: 'userId',
			x_c: 'appSignature',
			x_d: 'userSignature',
			x_t: 123456
		});

	t.is(url.host, 'example.com:8443');
	t.is(url.pathname, '/api/command');
	t.is(url.protocol, 'https:');

	const searchParameters = url.searchParams;
	t.is(searchParameters.get('x_a'), 'appId');
	t.is(searchParameters.get('x_b'), 'userId');
	t.is(searchParameters.get('x_c'), 'appSignature');
	t.is(searchParameters.get('x_d'), 'userSignature');
	t.is(searchParameters.get('x_t'), '123456');
});

test('_getTokenUrl allows for parameters on the path', t => {
	const url = ValenceAuth._getTokenUrl(
		new URL('/api/command?id=1', 'https://example.com:443'),
		{
			x_a: 'appId',
			x_b: 'userId',
			x_c: 'appSignature',
			x_d: 'userSignature',
			x_t: 123456
		});

	t.is(url.host, 'example.com');
	t.is(url.pathname, '/api/command');
	t.is(url.protocol, 'https:');

	const searchParameters = url.searchParams;
	t.is(searchParameters.get('id'), '1');
	t.is(searchParameters.get('x_a'), 'appId');
	t.is(searchParameters.get('x_b'), 'userId');
	t.is(searchParameters.get('x_c'), 'appSignature');
	t.is(searchParameters.get('x_d'), 'userSignature');
	t.is(searchParameters.get('x_t'), '123456');
});

test('_sign returns base64 HMAC-SHA256', t => {
	const hash = ValenceAuth._sign('foobar', 'bar');

	t.is(hash, '8MWnO0rB4dhvQbYdde_vEx3dbLS3RgumO-9WT90kQnQ');
});
