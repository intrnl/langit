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
	service: URL;
	rpc: XRPC;

	session: Signal<AtpSessionData | undefined>;

	#persistSession?: PersistSessionHandler;
	#refreshSessionPromise?: Promise<void>;

	constructor(options: AgentOptions) {
		this.service = new URL(options.service);
		this.#persistSession = options.persistSession;

		this.session = signal<AtpSessionData | undefined>(undefined);

		// monkeypatch the fetch handler to add authorization and expired token handling
		this.rpc = new XRPC(this.service);
		this.rpc.fetch = this.#fetch.bind(this);
	}

	async login(options: AtpLoginOptions) {
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

	async resumeSession(session: AtpSessionData) {
		const now = Date.now() / 1000 + 60 * 5;

		const refreshToken = decodeJwt(session.refreshJwt) as AtpRefreshJwt;

		if (now >= refreshToken.exp) {
			throw new Error('INVALID_TOKEN');
		}

		const accessToken = decodeJwt(session.accessJwt) as AtpAccessJwt;
		this.session.value = session;

		if (now >= accessToken.exp) {
			await this.#refreshSession();
		}

		if (!this.session.peek()) {
			throw new Error(`INVALID_TOKEN`);
		}
	}

	async #fetch(
		httpUri: string,
		httpMethod: string,
		httpHeaders: Headers,
		httpReqBody: unknown,
	): Promise<FetchHandlerResponse> {
		await this.#refreshSessionPromise;

		const session = this.session.peek();
		let res = await fetchHandler(httpUri, httpMethod, this.#addAuthHeader(httpHeaders), httpReqBody);

		if (isErrorResponse(res.body, ['ExpiredToken']) && session?.refreshJwt) {
			// refresh session
			await this.#refreshSession();

			// retry fetch
			res = await fetchHandler(httpUri, httpMethod, this.#addAuthHeader(httpHeaders), httpReqBody);
		}

		return res;
	}

	#addAuthHeader(httpHeaders: Headers) {
		const session = this.session.peek();

		if (!httpHeaders['authorization'] && session) {
			return {
				...httpHeaders,
				authorization: `Bearer ${session.accessJwt}`,
			};
		}

		return httpHeaders;
	}

	async #refreshSession() {
		if (this.#refreshSessionPromise) {
			return this.#refreshSessionPromise;
		}

		this.#refreshSessionPromise = this.#refreshSessionInner();

		try {
			await this.#refreshSessionPromise;
		} finally {
			this.#refreshSessionPromise = undefined;
		}
	}

	async #refreshSessionInner() {
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
			this.#persistSession?.('expired', undefined);
		} else if (httpResponseCodeToEnum(res.status) === ResponseType.Success) {
			// succeeded, update the session
			this.session.value = {
				accessJwt: res.body.accessJwt,
				refreshJwt: res.body.refreshJwt,
				handle: res.body.handle,
				did: res.body.did,
			};

			this.#persistSession?.('update', this.session.peek());
		}
	}
}

export interface AtpLoginOptions {
	identifier: string;
	password: string;
}
