'use strict';

const crypto = require('crypto');

module.exports = class ValenceAuth {
	constructor(
		{ appId, appKey, userId, userKey }
	) {
		this._appId = appId;
		this._appKey = appKey;
		this._userId = userId;
		this._userKey = userKey;
	}

	/**
	 * Builds an authenticated URL for Valence ID-Key authentication
	 * @param {URL} url The URL to authenticate
	 * @param {string} method The HTTP method
	 * @param {number} skew The clock skew in seconds
	 */
	createAuthenticatedUrl(url, method, skew = 0) {
		const timestamp = this._getTimestamp() + skew;

		const signatureData = `${method.toUpperCase()}&${decodeURI(url.pathname).toLowerCase()}&${timestamp}`;
		const signedAppData = ValenceAuth._sign(signatureData, this._appKey);
		const signedUserData = ValenceAuth._sign(signatureData, this._userKey);

		/* eslint-disable camelcase */
		const parameters = {
			x_a: this._appId,
			x_b: this._userId,
			x_c: signedAppData,
			x_d: signedUserData,
			x_t: timestamp
		};
		/* eslint-enable camelcase */

		return ValenceAuth._getTokenUrl(url, parameters);
	}

	_getTimestamp() {
		return Math.round(Date.now() / 1000);
	}

	static _getTokenUrl(url, parameters) {
		if (parameters) {
			Object.entries(parameters)
				.forEach(([key, value]) => url.searchParams.append(key, value));
		}

		return url;
	}

	static _sign(data, key) {
		const hash = crypto.createHmac('sha256', key);
		hash.update(data);

		return hash.digest('base64')
			.replace(/\+/gi, '-')
			.replace(/\//gi, '_')
			.replace(/=/gi, '');
	}
};
