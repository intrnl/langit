import { Agent, type AtpLoginOptions, type AtpSessionData } from './agent.ts';
import { ReactiveLocalStorage } from './storage.ts';
import { type DID } from './utils.ts';

export enum MultiagentState {
	PRISTINE,
	UNAUTHORIZED,
	PENDING,
	AUTHORIZED,
}

export interface MultiagentLoginOptions extends AtpLoginOptions {
	service: string;
}

export { type DID };

export interface MultiagentProfileData {
	displayName: string;
	handle: string;
	avatar?: string;
}

export interface MultiagentAccountData {
	did: DID;
	service: string;
	session: AtpSessionData;
	profile?: MultiagentProfileData;
}

interface MultiagentStorage {
	active: DID | undefined;
	accounts: Record<DID, MultiagentAccountData>;
}

const noop = () => {};

export class Multiagent {
	private _promise?: Promise<void>;

	public storage: ReactiveLocalStorage<MultiagentStorage>;

	/**
	 * A record of connected agents
	 */
	public agents: Record<DID, Agent> = {};

	constructor(name: string) {
		this.storage = new ReactiveLocalStorage(name);
	}

	/**
	 * A record of registered accounts
	 */
	get accounts() {
		return this.storage.get('accounts');
	}

	/**
	 * Active UID set as default
	 */
	get active() {
		return this.storage.get('active');
	}
	set active(next: DID | undefined) {
		this.storage.set('active', next);
	}

	/**
	 * Login with a new account
	 */
	async login({ service, identifier, password }: MultiagentLoginOptions): Promise<DID> {
		await this._promise;

		const agent = this._createAgent(service);

		try {
			const promise = agent.login({ identifier, password });
			this._promise = promise.then(noop, noop);

			await promise;

			// check if there are existing accounts that shares the same account,
			// if so, use that instead.
			const session = agent.session.value!;
			const did = session.did;

			const accounts = this.accounts;

			if (accounts && did in accounts) {
				this.storage.set('active', did);
				return did;
			}

			this.storage.set('active', did);
			this.storage.set('accounts', {
				...this.storage.get('accounts'),
				[did]: {
					did: did,
					service: service,
					session: session,
				},
			});

			this.agents[did] = agent;
			return did;
		} catch (err) {
			throw new Error(`Failed to login`, { cause: err });
		}
	}

	/**
	 * Log out from account
	 */
	async logout(did: DID): Promise<void> {
		await this._promise;

		let shouldRedirect = false;

		if (!(did in this.accounts)) {
			return;
		}

		if (this.active === did) {
			let nextActiveId: DID | undefined;

			for (nextActiveId in this.accounts) {
				if (nextActiveId === did) {
					nextActiveId = undefined;
					continue;
				}

				break;
			}

			this.active = nextActiveId;
		}

		const next = { ...this.storage.get('accounts') };
		delete next[did];

		this.storage.set('accounts', next);
	}

	/**
	 * Retrieve an agent associated with an account
	 */
	async connect(did: DID): Promise<Agent> {
		await this._promise;

		if (did in this.agents) {
			return this.agents[did];
		}

		const accounts = this.storage.get('accounts');
		const data = accounts && accounts[did];

		if (!data) {
			throw new Error(`Invalid account`);
		}

		const agent = this._createAgent(data.service);

		try {
			const promise = agent.resumeSession(data.session);
			this._promise = promise.then(noop, noop);

			await promise;

			this.agents[did] = agent;
			return agent;
		} catch (err) {
			throw new Error(`Failed to resume session`, { cause: err });
		}
	}

	private _createAgent(serviceUri: string) {
		const agent = new Agent({
			service: serviceUri,
			persistSession: (type, session) => {
				if (type === 'update') {
					const did = session!.did;

					this.storage.set('accounts', {
						...this.storage.get('accounts'),
						[did]: {
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
