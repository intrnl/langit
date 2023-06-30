import {
	type Resource,
	batch,
	createContext,
	createMemo,
	createResource,
	onCleanup,
	startTransition,
	useContext,
} from 'solid-js';

import { makeEventListener } from '@solid-primitives/event-listener';

import { type QueryKey, hashQueryKey } from './key.ts';
import { noop } from './utils.ts';

import { type Signal, signal } from '~/utils/signals.ts';

class QueryResult<Data> {
	public _fetch = 0;
	public _fresh = true;
	public _loading = false;

	public _promise: Signal<Promise<Data>>;
	public _refetchParam: Signal<unknown> = signal<unknown>(undefined);

	public _uses = 0;
	public _timeout?: any;

	constructor(public value?: Data, public updatedAt = -1) {
		this._promise = signal(value !== undefined ? Promise.resolve(value) : new Promise(noop));
	}
}

export interface QueryInfo<Data, Param = unknown> {
	data: Data | undefined;
	param: Param | undefined;
}

export type QueryFn<Data, Key extends QueryKey = QueryKey, Param = unknown> = (
	key: Key,
	info: QueryInfo<Data, Param>,
) => Data | Promise<Data>;

export type QueryDataReplacer<Data> = (prev: Data | undefined, next: Data) => Data;

export interface QueryContextOptions<Data = unknown, Key extends QueryKey = QueryKey, Info = unknown> {
	fetch?: QueryFn<Data, Key, Info>;
	cache?: Map<string, QueryResult<Data>>;
	staleTime?: number;
	cacheTime?: number;
	replaceData?: QueryDataReplacer<Data>;
	refetchOnMount?: boolean;
	refetchOnWindowFocus?: boolean;
	refetchOnReconnect?: boolean;
	refetchInterval?: number;
}

export interface InitialDataReturn<Data> {
	data: Data;
	updatedAt?: number;
}

export type InitialDataFn<Data, Key extends QueryKey> = (key: Key) => InitialDataReturn<Data> | undefined;

export interface QueryOptions<Data = unknown, Key extends QueryKey = QueryKey, Param = unknown>
	extends QueryContextOptions<Data, Key, Param> {
	key: () => Key;

	initialData?: InitialDataFn<Data, Key>;
	enabled?: boolean | (() => boolean);
}

export interface QueryActions<Data, Param> {
	refetch(force?: boolean, info?: Param): void | Promise<void>;
	mutate(data: Data): void;
}

export type EnhancedResource<Data, Param = unknown> = Resource<Data> & { refetchParam: Param | undefined };
export type QueryReturn<Data, Param> = [EnhancedResource<Data, Param>, QueryActions<Data, Param>];

export const defaultQueryOptions: QueryContextOptions = {
	cache: new Map(),
	staleTime: 3 * 1_000, // 3 seconds
	cacheTime: 5 * 60 * 1_000, // 5 minutes
	replaceData: (prev, next) => (prev === next ? prev : next),
	refetchOnMount: true,
	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
};

export const QueryContext = createContext(defaultQueryOptions);

export const createQuery = <Data, Key extends QueryKey, Param = unknown>(
	options: QueryOptions<Data, Key, Param>,
): QueryReturn<Data, Param> => {
	const resolvedOptions: QueryOptions<Data, Key> = { ...(useContext(QueryContext) as any), ...options };

	const {
		key,
		fetch,

		cache,
		initialData,
		enabled = true,

		staleTime,
		cacheTime,
		replaceData,
		refetchOnMount,
		refetchOnWindowFocus,
		refetchOnReconnect,
		refetchInterval,
	} = resolvedOptions;

	const isEnabled = typeof enabled === 'function' ? createMemo(enabled) : () => enabled;

	const source = createMemo(
		() => {
			if (!isEnabled()) {
				return;
			}

			const $key = key();
			return { key: $key, hash: hashQueryKey($key) };
		},
		undefined,
		{ equals: (a, b) => a?.hash === b?.hash },
	);

	const instance = createMemo((): QueryReturn<Data, Param> => {
		const $source = source();

		if (!$source) {
			// @ts-expect-error
			const [resource] = createResource<Data, false>(false, noop);

			return [resource as EnhancedResource<Data, Param>, { refetch: noop, mutate: noop }];
		}

		const key = $source.key;
		const hash = $source.hash;

		let query = cache!.get(hash);

		if (!query) {
			const result = initialData?.(key);

			if (result) {
				query = new QueryResult(result.data, result.updatedAt);
			} else {
				query = new QueryResult<Data>();
			}

			cache!.set(hash, query);
		}

		const [read] = createResource<Data, Promise<Data>>(
			() => query!._promise.value,
			($promise) => $promise,
			query!.value !== undefined ? { initialValue: query!.value } : {},
		);

		const refetch = (force = false, info?: unknown) => {
			if (force || query!._fresh || (!query!._loading && Date.now() - query!.updatedAt > staleTime!)) {
				const id = ++query!._fetch;

				const promise = (async () => {
					let errored = false;
					let value: unknown;

					try {
						const prev = query!.value;
						const next = await fetch!(key, { data: prev, param: info });

						const replaced = replaceData!(prev, next);

						value = replaced;
					} catch (err) {
						errored = true;
						value = err;
					}

					if (query!._fetch === id) {
						if (errored) {
							query!._fresh = true;
						} else {
							query!.value = value as Data;
							query!.updatedAt = Date.now();
						}

						query!._loading = false;
					}

					if (errored) {
						throw value;
					} else {
						return value as Data;
					}
				})();

				batch(() => {
					query!._refetchParam.value = info;
					query!._promise.value = promise;

					query!._fresh = false;
					query!._loading = true;
				});

				return promise.then(noop, noop);
			}
		};

		const mutate = (data: Data) => {
			return batch(() => {
				query!._promise.value = Promise.resolve(data);
				query!._refetchParam.value = undefined;

				query!._fetch++;
				query!._fresh = false;
				query!._loading = false;

				query!.value = data;
				query!.updatedAt = Date.now();
			});
		};

		const refetchWithTransition = () => {
			return startTransition(refetch);
		};

		clearTimeout(query._timeout);
		query._uses++;

		if (refetchOnMount || query!._fresh) {
			queueMicrotask(refetchWithTransition);
		}
		if (refetchOnWindowFocus) {
			makeEventListener(window, 'visibilitychange', refetchWithTransition);
			makeEventListener(window, 'focus', refetchWithTransition);
		}
		if (refetchOnReconnect) {
			makeEventListener(window, 'online', refetchWithTransition);
		}
		if (refetchInterval !== undefined) {
			const interval = setInterval(refetchWithTransition, refetchInterval);
			onCleanup(() => clearInterval(interval));
		}

		onCleanup(() => {
			if (--query!._uses < 1) {
				query!._timeout = setTimeout(() => cache!.delete(hash), cacheTime!);
			}
		});

		Object.defineProperties(read, {
			refetchParam: {
				get: () => query!._refetchParam.value,
			},
		});

		return [read as EnhancedResource<Data, Param>, { refetch, mutate }];
	});

	const read = () => {
		return instance()[0]();
	};

	Object.defineProperties(read, {
		state: {
			get: () => instance()[0].state,
		},
		error: {
			get: () => instance()[0].error,
		},
		loading: {
			get: () => instance()[0].loading,
		},
		latest: {
			get: () => instance()[0].latest,
		},
		refetchParam: {
			get: () => instance()[0].refetchParam,
		},
	});

	return [
		read as EnhancedResource<Data, Param>,
		{
			refetch: (force, info) => instance()[1].refetch(force, info),
			mutate: (data) => instance()[1].mutate(data),
		},
	];
};
