import { type DID } from './utils.ts';

import {
	type Headers,
	ResponseType,
	httpResponseCodeToEnum,
} from '~/api/rpc/xrpc-utils.ts';
import { type FetchHandlerResponse, XRPC, fetchHandler, isErrorResponse } from '~/api/rpc/xrpc.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type SessionType = 'create' | 'create-failed' | 'update' | 'expired';
type PersistSessionHandler = (type: SessionType, session?: AtpSessionData) => void;

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

	constructor (options: AgentOptions) {
		this.service = new URL(options.service);
		this._persistSession = options.persistSession;

		this.session = signal<AtpSessionData | undefined>(undefined);

		// monkeypatch the fetch handler to add authorization and expired token handling
		this.rpc = new XRPC(this.service);
		this.rpc.fetch = this._fetch.bind(this);
	}

	public async login (options: AtpLoginOptions) {
		try {
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
		catch (e) {
			this.session.value = undefined;
			throw e;
		}
		finally {
			const session = this.session.peek();

			if (session) {
				this._persistSession?.('create', session);
			}
			else {
				this._persistSession?.('create-failed', undefined);
			}
		}
	}

	public async resumeSession (session: AtpSessionData) {
		try {
			this.session.value = session;

			const res = await this.rpc.get({ method: 'com.atproto.server.getSession' });

			if (!res.success || res.data.did !== session.did) {
				throw new Error('Invalid session');
			}

			this.session.value = {
				...session,
				email: res.data.email,
				handle: res.data.handle,
			};

			return res;
		}
		catch (e) {
			this.session.value = undefined;
			throw e;
		}
		finally {
			const session = this.session.peek();

			if (session) {
				this._persistSession?.('create', session);
			}
			else {
				this._persistSession?.('create-failed', undefined);
			}
		}
	}

	private async _fetch (
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

	private _addAuthHeader (httpHeaders: Headers) {
		const session = this.session.peek();

		if (!httpHeaders['authorization'] && session?.accessJwt) {
			return {
				...httpHeaders,
				'authorization': `Bearer ${session.accessJwt}`,
			};
		}

		return httpHeaders;
	}

	private async _refreshSession () {
		if (this._refreshSessionPromise) {
			return this._refreshSessionPromise;
		}

		this._refreshSessionPromise = this._refreshSessionInner();

		try {
			await this._refreshSessionPromise;
		}
		finally {
			this._refreshSessionPromise = undefined;
		}
	}

	private async _refreshSessionInner () {
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

		if (isErrorResponse(res, ['ExpiredToken', 'InvalidToken'])) {
			// failed due to a bad refresh token
			this.session.value = undefined;
			this._persistSession?.('expired', undefined);
		}
		else if (httpResponseCodeToEnum(res.status) === ResponseType.Success) {
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
