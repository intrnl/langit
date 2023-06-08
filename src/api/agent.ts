import decodeJwt from 'jwt-decode';

import { type DID } from './utils.ts';

import { type Headers, ResponseType, httpResponseCodeToEnum } from './rpc/xrpc-utils.ts';
import { type FetchHandlerResponse, XRPC, fetchHandler, isErrorResponse } from './rpc/xrpc.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type SessionType = 'update' | 'expired';
type PersistSessionHandler = (type: SessionType, session?: AtpSessionData) => void;

interface AtpAccessJwt {
	scope: 'com.atproto.access';
	sub: DID;
	exp: number;
	iat: number;
}

interface AtpRefreshJwt {
	scope: 'com.atproto.refresh';
	sub: DID;
	exp: number;
	iat: number;
	jti: string;
}

export interface AtpSessionData {
	refreshJwt: string;
	accessJwt: string;
	handle: string;
	did: DID;
	email?: string;
}

export interface AgentOptions {
	service: string;
	persistSession?: PersistSessionHandler;
}

export class Agent {
	public service: URL;
	public rpc: XRPC;

	public session: Signal<AtpSessionData | undefined>;

	private _persistSession?: PersistSessionHandler;
	private _refreshSessionPromise?: Promise<void>;

	constructor(options: AgentOptions) {
		this.service = new URL(options.service);
		this._persistSession = options.persistSession;

		this.session = signal<AtpSessionData | undefined>(undefined);

		// monkeypatch the fetch handler to add authorization and expired token handling
		this.rpc = new XRPC(this.service);
		this.rpc.fetch = this._fetch.bind(this);
	}

	public async login(options: AtpLoginOptions) {
		this.session.value = undefined;

		const res = await this.rpc.post({
			method: 'com.atproto.server.createSession',
			data: {
				identifier: options.identifier,
				password: options.password,
			},
		});

		this.session.value = {
			accessJwt: res.data.accessJwt,
			refreshJwt: res.data.refreshJwt,
			handle: res.data.handle,
			did: res.data.did,
			email: res.data.email,
		};

		return res;
	}

	public async resumeSession(session: AtpSessionData) {
		const now = Date.now() / 1000 + 60 * 5;

		const refreshToken = decodeJwt(session.refreshJwt) as AtpRefreshJwt;

		if (now >= refreshToken.exp) {
			throw new Error('INVALID_TOKEN');
		}

		const accessToken = decodeJwt(session.accessJwt) as AtpAccessJwt;
		this.session.value = session;

		if (now >= accessToken.exp) {
			await this._refreshSession();
		}

		if (!this.session.peek()) {
			throw new Error(`INVALID_TOKEN`);
		}
	}

	private async _fetch(
		httpUri: string,
		httpMethod: string,
		httpHeaders: Headers,
		httpReqBody: unknown,
	): Promise<FetchHandlerResponse> {
		await this._refreshSessionPromise;

		const session = this.session.peek();
		let res = await fetchHandler(httpUri, httpMethod, this._addAuthHeader(httpHeaders), httpReqBody);

		if (isErrorResponse(res.body, ['ExpiredToken']) && session?.refreshJwt) {
			// refresh session
			await this._refreshSession();

			// retry fetch
			res = await fetchHandler(httpUri, httpMethod, this._addAuthHeader(httpHeaders), httpReqBody);
		}

		return res;
	}

	private _addAuthHeader(httpHeaders: Headers) {
		const session = this.session.peek();

		if (!httpHeaders['authorization'] && session) {
			return {
				...httpHeaders,
				authorization: `Bearer ${session.accessJwt}`,
			};
		}

		return httpHeaders;
	}

	private async _refreshSession() {
		if (this._refreshSessionPromise) {
			return this._refreshSessionPromise;
		}

		this._refreshSessionPromise = this._refreshSessionInner();

		try {
			await this._refreshSessionPromise;
		} finally {
			this._refreshSessionPromise = undefined;
		}
	}

	private async _refreshSessionInner() {
		const session = this.session.peek();

		if (!session || !session.refreshJwt) {
			return;
		}

		// we can't use `rpc.call` here because we've monkeypatched it to handle
		// expired token, as this is part of the expired token handling, we must
		// manually craft an rpc request

		// send the refresh request
		const url = new URL(`/xrpc/com.atproto.server.refreshSession`, this.service);

		const res = await fetchHandler(
			url.toString(),
			'POST',
			{
				authorization: `Bearer ${session.refreshJwt}`,
			},
			undefined,
		);

		if (isErrorResponse(res.body, ['ExpiredToken', 'InvalidToken'])) {
			// failed due to a bad refresh token
			this.session.value = undefined;
			this._persistSession?.('expired', undefined);
		} else if (httpResponseCodeToEnum(res.status) === ResponseType.Success) {
			// succeeded, update the session
			this.session.value = {
				accessJwt: res.body.accessJwt,
				refreshJwt: res.body.refreshJwt,
				handle: res.body.handle,
				did: res.body.did,
			};

			this._persistSession?.('update', this.session.peek());
		}
	}
}

export interface AtpLoginOptions {
	identifier: string;
	password: string;
}
