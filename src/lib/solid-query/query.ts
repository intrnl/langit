import {
	type Resource,
	batch,
	createContext,
	createMemo,
	createResource,
	onCleanup,
	useContext,
} from 'solid-js';

import { makeEventListener } from '@solid-primitives/event-listener';

import { type QueryKey, hashQueryKey } from './key.ts';
import { noop } from './utils.ts';

import { assert } from '~/utils/misc.ts';
import { type Signal, signal } from '~/utils/signals.ts';

class QueryResult<Data> {
	public _fresh = true;
	public _loading = false;

	public _promise: Signal<Promise<Data>>;
	public _refetchParam: Signal<unknown> = signal<unknown>(undefined);

	public _count = 0;
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

export interface QueryContextOptions<Data = unknown, Key extends QueryKey = QueryKey, Info = unknown> {
	fetch?: QueryFn<Data, Key, Info>;
	cache?: Map<string, QueryResult<Data>>;
	staleTime?: number;
	cacheTime?: number;
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
		refetchOnMount,
		refetchOnWindowFocus,
		refetchOnReconnect,
		refetchInterval,
	} = resolvedOptions;

	const source = createMemo(
		() => {
			const $enabled = typeof enabled === 'function' ? enabled() : enabled;

			if ($enabled) {
				const $key = key();
				return { key: $key, hash: hashQueryKey($key) };
			}
		},
		undefined,
		{ equals: (a, b) => !!a && !!b && a.hash === b.hash },
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
				const promise = (async () => {
					let same = false;

					try {
						const result = await fetch!(key, { data: query!.value, param: info });

						if (result === undefined) {
							assert(false, `query function must not return undefined`);
						}

						if ((same = query?._promise.peek() === promise!)) {
							query!.value = result;
							query!.updatedAt = Date.now();
						}

						return result;
					} catch (err) {
						if ((same = query?._promise.peek() === promise!)) {
							query._fresh = true;
						}

						throw err;
					} finally {
						if (same) {
							query!._loading = false;
						}
					}
				})();

				batch(() => {
					query!._fresh = false;
					query!._loading = true;
					query!._refetchParam.value = info;
					query!._promise.value = promise;
				});

				return promise.then(noop, noop);
			}
		};

		const mutate = (data: Data) => {
			query!._promise.value = Promise.resolve(data);
			query!.updatedAt = Date.now();
		};

		clearTimeout(query._timeout);
		query._count++;

		if (refetchOnMount || query!._fresh) {
			refetch();
		}
		if (refetchOnWindowFocus) {
			makeEventListener(document, 'visibilitychange', () => document.hidden || refetch());
		}
		if (refetchOnReconnect) {
			makeEventListener(window, 'online', () => refetch());
		}
		if (refetchInterval !== undefined) {
			const interval = setInterval(() => refetch(), refetchInterval);
			onCleanup(() => clearInterval(interval));
		}

		onCleanup(() => {
			if (--query!._count < 1) {
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
