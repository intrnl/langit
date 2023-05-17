import { Agent, type AtpLoginOptions, type AtpSessionData } from './agent.ts';
import { ReactiveLocalStorage } from './storage.ts';

export enum MultiagentState {
	PRISTINE,
	UNAUTHORIZED,
	PENDING,
	AUTHORIZED,
}

export interface MultiagentLoginOptions extends AtpLoginOptions {
	service: string;
}

/** Assigned account ID */
export type UID = string;

export interface MultiagentAccountData {
	did: string;
	service: string;
	session: AtpSessionData;
}

interface MultiagentStorage {
	counter: number;
	active: UID | undefined;
	accounts: Record<UID, MultiagentAccountData>;
}

const noop = () => {};

export class Multiagent {
	private _storage: ReactiveLocalStorage<MultiagentStorage>;
	private _promise?: Promise<void>;

	/**
	 * A record of connected agents
	 */
	public agents: Record<UID, Agent> = {};

	constructor (name: string) {
		this._storage = new ReactiveLocalStorage(name);
	}

	/**
	 * A record of registered accounts
	 */
	get accounts () {
		return this._storage.get('accounts');
	}

	/**
	 * Active UID set as default
	 */
	get active () {
		return this._storage.get('active');
	}
	set active (next: string | undefined) {
		this._storage.set('active', next);
	}

	/**
	 * Login with a new account
	 */
	async login ({ service, identifier, password }: MultiagentLoginOptions): Promise<UID> {
		await this._promise;

		const count = this._storage.get('counter') || 0;
		const uid = '' + count;

		const agent = this._createAgent(uid, service);

		try {
			const promise = agent.login({ identifier, password });
			this._promise = promise.then(noop, noop);

			await promise;

			// check if there are existing accounts that shares the same account,
			// if so, use that instead.
			const session = agent.session.value!;
			const did = session.did;

			const accounts = this.accounts;

			for (const aid in accounts) {
				const account = accounts[aid];

				if (did === account.did) {
					return aid;
				}
			}

			this._storage.set('counter', count + 1);
			this._storage.set('active', uid);
			this._storage.set('accounts', {
				...this._storage.get('accounts'),
				[uid]: {
					did: did,
					service: service,
					session: session,
				},
			});

			this.agents[uid] = agent;
			return uid;
		}
		catch (err) {
			throw new Error(`Failed to login`, { cause: err });
		}
	}

	/**
	 * Sign out from account
	 */
	async signout (uid: string): Promise<void> {
		// TODO: implement signout functionality
	}

	/**
	 * Retrieve an agent associated with an account
	 */
	async connect (uid: string): Promise<Agent> {
		await this._promise;

		if (uid in this.agents) {
			return this.agents[uid];
		}

		const accounts = this._storage.get('accounts');
		const data = accounts && accounts[uid];

		if (!data) {
			throw new Error(`Invalid account`);
		}

		const agent = this._createAgent(uid, data.service);

		try {
			const promise = agent.resumeSession(data.session);
			this._promise = promise.then(noop, noop);

			await promise;

			this.agents[uid] = agent;
			return agent;
		}
		catch (err) {
			throw new Error(`Failed to resume session`, { cause: err });
		}
	}

	private _createAgent (uid: string, serviceUri: string) {
		const agent = new Agent({
			service: serviceUri,
			persistSession: (type, session) => {
				if (type === 'update') {
					this._storage.set('accounts', {
						...this._storage.get('accounts'),
						[uid]: {
							did: session!.did,
							service: serviceUri,
							session: session!,
						},
					});
				}
			},
		});

		return agent;
	}
}
