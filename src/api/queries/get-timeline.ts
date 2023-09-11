import type { Agent } from '@intrnl/bluesky-client/agent';
import type { DID, Records, RefOf, ResponseOf } from '@intrnl/bluesky-client/atp-schema';
import type { EnhancedResource, QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';
import { systemLanguages } from '~/globals/platform.ts';
import { getAccountModerationPreferences, preferences } from '~/globals/preferences.ts';
import { assert } from '~/utils/misc.ts';

import {
	type PostFilter,
	type SignalizedTimelineItem,
	type SliceFilter,
	type TimelineSlice,
	createTimelineSlices,
	createUnjoinedSlices,
} from '../models/timeline.ts';

import {
	type ModerationCause,
	decideLabelModeration,
	decideMutedKeywordModeration,
	finalizeModeration,
} from '../moderation/action.ts';
import { PreferenceHide } from '../moderation/enums.ts';
import { type Collection, pushCollection } from '../utils.ts';

import { fetchPost } from './get-post.ts';

export interface HomeTimelineParams {
	type: 'home';
	algorithm: 'reverse-chronological' | (string & {});
}

export interface CustomTimelineParams {
	type: 'custom';
	uri: string;
}

export interface ProfileTimelineParams {
	type: 'profile';
	actor: DID;
	tab: 'posts' | 'replies' | 'likes' | 'media';
}

export interface SearchTimelineParams {
	type: 'search';
	query: string;
}

export type FeedParams =
	| HomeTimelineParams
	| CustomTimelineParams
	| ProfileTimelineParams
	| SearchTimelineParams;

export interface FeedPage {
	cursor?: string;
	cid?: string;
	slices: TimelineSlice[];
	remainingSlices: TimelineSlice[];
}

export interface FeedLatestResult {
	cid: string | undefined;
}

export type FeedResource = EnhancedResource<Collection<FeedPage>, string>;
export type FeedLatestResource = EnhancedResource<FeedLatestResult>;

type TimelineResponse = ResponseOf<'app.bsky.feed.getTimeline'>;

type Post = RefOf<'app.bsky.feed.defs#postView'>;

type PostRecord = Records['app.bsky.feed.post'];
type LikeRecord = Records['app.bsky.feed.like'];

//// Feed query
// How many attempts it should try looking for more items before it gives up on empty pages.
const MAX_EMPTY = 3;

const MAX_POSTS = 20;

const countPosts = (slices: TimelineSlice[], limit?: number) => {
	let count = 0;

	let idx = 0;
	let len = slices.length;

	for (; idx < len; idx++) {
		const slice = slices[idx];
		count += slice.items.length;

		if (limit !== undefined && count >= limit) {
			return idx;
		}
	}

	if (limit !== undefined) {
		return len;
	}

	return count;
};

// Error thrown when post search is being used outside of bsky.social, since we
// are currently unable to determine the BGS affiliation of other instances.
// ref: https://github.com/bluesky-social/atproto/issues/1307
export class IncompatibleSearchError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'IncompatibleSearchError';
	}
}

export const getTimelineKey = (uid: DID, params: FeedParams, limit = MAX_POSTS) => {
	return ['getFeed', uid, params, limit] as const;
};
export const getTimeline: QueryFn<Collection<FeedPage>, ReturnType<typeof getTimelineKey>, string> = async (
	key,
	{ data: prevData, param: prevCursor },
) => {
	const [, uid, params, limit] = key;
	const type = params.type;

	const agent = await multiagent.connect(uid);

	let cursor = prevCursor;
	let empty = 0;
	let cid: string | undefined;

	let slices: TimelineSlice[];
	let count = 0;

	let sliceFilter: SliceFilter | undefined | null;
	let postFilter: PostFilter | undefined;

	if (cursor && prevData) {
		const pages = prevData.pages;
		const last = pages[pages.length - 1];

		slices = last.remainingSlices;
		count = countPosts(slices);
	} else {
		slices = [];
	}

	if (type === 'home') {
		sliceFilter = createHomeSliceFilter(uid);
		postFilter = combine([
			createHiddenRepostFilter(uid),
			createDuplicatePostFilter(slices),
			createLabelPostFilter(uid),
			createTempMutePostFilter(uid),
		]);
	} else if (type === 'custom') {
		postFilter = combine([
			createDuplicatePostFilter(slices),
			createLanguagePostFilter(uid),
			createLabelPostFilter(uid),
			createTempMutePostFilter(uid),
		]);
	} else if (type === 'profile') {
		postFilter = createLabelPostFilter(uid);

		if (params.tab !== 'likes' && params.tab !== 'media') {
			sliceFilter = createProfileSliceFilter(params.actor, params.tab === 'replies');
		} else {
			sliceFilter = null;
		}
	} else {
		postFilter = createLabelPostFilter(uid);
	}

	while (count < limit) {
		const timeline = await fetchPage(agent, params, limit, cursor);

		const feed = timeline.feed;
		const result =
			sliceFilter !== null
				? createTimelineSlices(uid, feed, sliceFilter, postFilter)
				: createUnjoinedSlices(uid, feed, postFilter);

		cursor = timeline.cursor;
		empty = result.length > 0 ? 0 : empty + 1;
		slices = slices.concat(result);

		count += countPosts(result);

		cid ||= feed.length > 0 ? feed[0].post.cid : undefined;

		if (!cursor || empty >= MAX_EMPTY) {
			break;
		}
	}

	// we're still slicing by the amount of slices and not amount of posts
	const remainingSlices = slices.splice(countPosts(slices, limit) + 1, slices.length);

	const page: FeedPage = {
		cursor,
		cid,
		slices,
		remainingSlices,
	};

	return pushCollection(prevData, page, prevCursor);
};

/// Latest feed query
export const getTimelineLatestKey = (uid: DID, params: FeedParams) => {
	return ['getFeedLatest', uid, params] as const;
};
export const getTimelineLatest: QueryFn<FeedLatestResult, ReturnType<typeof getTimelineLatestKey>> = async (
	key,
) => {
	const [, uid, params] = key;

	const agent = await multiagent.connect(uid);

	const timeline = await fetchPage(agent, params, 1, undefined);
	const feed = timeline.feed;

	return { cid: feed.length > 0 ? feed[0].post.cid : undefined };
};

//// Raw fetch
type SearchResult = PostSearchView[];

interface PostSearchView {
	tid: string;
	cid: string;
	user: {
		did: DID;
		handle: string;
	};
	post: {
		createdAt: number;
		text: string;
		user: string;
	};
}

const fetchPage = async (
	agent: Agent,
	params: FeedParams,
	limit: number,
	cursor: string | undefined,
): Promise<TimelineResponse> => {
	const type = params.type;

	if (type === 'home') {
		const response = await agent.rpc.get('app.bsky.feed.getTimeline', {
			params: {
				algorithm: params.algorithm,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'custom') {
		const response = await agent.rpc.get('app.bsky.feed.getFeed', {
			params: {
				feed: params.uri,
				cursor: cursor,
				limit: limit,
			},
		});

		return response.data;
	} else if (type === 'profile') {
		if (params.tab === 'likes') {
			const uid = agent.session!.did;

			const recordsResponse = await agent.rpc.get('com.atproto.repo.listRecords', {
				params: {
					repo: params.actor,
					collection: 'app.bsky.feed.like',
					cursor: cursor,
					limit: limit,
				},
			});

			const recordsData = recordsResponse.data;
			const recordsCursor = recordsData.cursor;

			const queries = await Promise.allSettled(
				recordsData.records.map((rec) => fetchPost([uid, (rec.value as LikeRecord).subject.uri])),
			);

			return {
				cursor: recordsCursor,
				feed: queries
					.filter((result): result is PromiseFulfilledResult<Post> => result.status === 'fulfilled')
					.map((result) => ({ post: result.value })),
			};
		} else {
			const response = await agent.rpc.get('app.bsky.feed.getAuthorFeed', {
				params: {
					actor: params.actor,
					cursor: cursor,
					limit: limit,
					filter: params.tab === 'media' ? 'posts_with_media' : 'posts_with_replies',
				},
			});

			return response.data;
		}
	} else if (type === 'search') {
		if (agent.rpc.serviceUri !== 'https://bsky.social') {
			throw new IncompatibleSearchError();
		}

		const offset = cursor ? +cursor : 0;
		const searchUri =
			`https://search.bsky.social/search/posts` +
			`?count=${limit}` +
			`&offset=${offset}` +
			`&q=${encodeURI(params.query)}`;

		const searchResponse = await fetch(searchUri);

		if (!searchResponse.ok) {
			throw new Error(`Response error ${searchResponse.status}`);
		}

		const searchResults = (await searchResponse.json()) as SearchResult;

		const postUris = searchResults.map((view) => `at://${view.user.did}/${view.tid}`);

		const uid = agent.session!.did;
		const queries = await Promise.allSettled(postUris.map((uri) => fetchPost([uid, uri])));

		const posts = queries
			.filter((result): result is PromiseFulfilledResult<Post> => result.status === 'fulfilled')
			.map((result) => ({ post: result.value }));

		return {
			cursor: '' + (offset + postUris.length),
			feed: posts,
		};
	} else {
		assert(false, `Unknown type: ${type}`);
	}
};

//// Feed filters
type FilterFn<T> = (data: T) => boolean;

const combine = <T>(filters: Array<undefined | FilterFn<T>>): FilterFn<T> | undefined => {
	const filtered = filters.filter((filter): filter is FilterFn<T> => filter !== undefined);
	const len = filtered.length;

	if (len < 1) {
		return;
	}

	return (data: T) => {
		for (let idx = 0; idx < len; idx++) {
			const filter = filtered[idx];

			if (!filter(data)) {
				return false;
			}
		}

		return true;
	};
};

const createDuplicatePostFilter = (slices: TimelineSlice[]): PostFilter => {
	const map: Record<string, boolean> = {};

	for (let i = 0, il = slices.length; i < il; i++) {
		const slice = slices[i];
		const items = slice.items;

		for (let j = 0, jl = items.length; j < jl; j++) {
			const item = items[j];
			const uri = item.post.uri;

			map[uri] = true;
		}
	}

	return (item) => {
		const uri = item.post.uri;

		if (map[uri]) {
			return false;
		}

		return (map[uri] = true);
	};
};

const createLabelPostFilter = (uid: DID): PostFilter | undefined => {
	const prefs = getAccountModerationPreferences(uid);

	return (item) => {
		const post = item.post;
		const labels = post.labels;

		const accu: ModerationCause[] = [];
		decideLabelModeration(accu, labels, post.author.did, prefs);
		decideMutedKeywordModeration(accu, (post.record as PostRecord).text, PreferenceHide, prefs);

		const decision = finalizeModeration(accu);

		return !decision?.f;
	};
};

const createLanguagePostFilter = (uid: DID): PostFilter | undefined => {
	const $prefs = preferences[uid] || {};

	const allowUnspecified = $prefs.cl_unspecified ?? true;
	let languages = $prefs.cl_codes;

	if ($prefs.cl_systemLanguage ?? true) {
		languages = languages ? systemLanguages.concat(languages) : systemLanguages;
	}

	if (!languages || languages.length < 1) {
		return undefined;
	}

	return (item) => {
		const record = item.post.record as PostRecord;
		const langs = record.langs;

		if (!record.text) {
			return true;
		}

		if (!langs || langs.length < 1) {
			return allowUnspecified;
		}

		return langs.some((code) => languages!.includes(code));
	};
};

const createHiddenRepostFilter = (uid: DID): PostFilter | undefined => {
	const $prefs = preferences[uid];

	const hidden = $prefs?.pf_hideReposts;

	if (!hidden) {
		return;
	}

	return (item) => {
		const reason = item.reason;

		return !reason || reason.$type !== 'app.bsky.feed.defs#reasonRepost' || !hidden.includes(reason.by.did);
	};
};

const createTempMutePostFilter = (uid: DID): PostFilter | undefined => {
	const $prefs = preferences[uid];
	const now = Date.now();

	let mutes = $prefs?.pf_tempMutes;

	// check if there are any outdated mutes before proceeding
	if (mutes) {
		let size = 0;
		let outdated = false;

		for (const did in mutes) {
			const date = mutes[did as DID];

			if (date === undefined || now >= date) {
				// this is the first time encountering an outdated mute, we'll clone the
				// object so we can delete it.
				if (!outdated) {
					mutes = { ...mutes };
					outdated = true;
				}

				delete mutes[did as DID];
				continue;
			}

			size++;
		}

		// set mutes to undefined if we no longer have any
		if (size < 1) {
			mutes = undefined;
		}

		if (outdated) {
			$prefs!.pf_tempMutes = mutes;
		}
	}

	if (!mutes) {
		return undefined;
	}

	return (item) => {
		const reason = item.reason;

		if (reason) {
			const byDid = reason.by.did;

			if (mutes![byDid] && now < mutes![byDid]!) {
				return false;
			}
		}

		const did = item.post.author.did;

		if (mutes![did] && now < mutes![did]!) {
			return false;
		}

		return true;
	};
};

const createHomeSliceFilter = (uid: DID): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		// skip any posts that are in reply to non-followed
		if (first.reply && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			const root = first.reply.root;
			const parent = first.reply.parent;

			const rAuthor = root.author;
			const pAuthor = parent.author;

			const rViewer = rAuthor.viewer;
			const pViewer = pAuthor.viewer;

			if (
				(rAuthor.did !== uid && (!rViewer.following.peek() || rViewer.muted.peek())) ||
				(pAuthor.did !== uid && (!pViewer.following.peek() || pViewer.muted.peek()))
			) {
				return yankReposts(items);
			}
		} else if (first.post.record.peek().reply) {
			return yankReposts(items);
		}

		return true;
	};
};

const createProfileSliceFilter = (did: DID, replies: boolean): SliceFilter | undefined => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		if (!replies && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			const reply = first.reply;

			if (reply) {
				const root = reply.root;
				const parent = reply.parent;

				if (root.author.did !== did || parent.author.did !== did) {
					return yankReposts(items);
				}
			} else if (first.post.record.peek().reply) {
				return yankReposts(items);
			}
		}

		return true;
	};
};

// Get the reposts out of the gutter
const yankReposts = (items: SignalizedTimelineItem[]): TimelineSlice[] | false => {
	let slices: TimelineSlice[] | false = false;
	let last: SignalizedTimelineItem[] | undefined;

	for (let idx = 0, len = items.length; idx < len; idx++) {
		const item = items[idx];

		if (item.reason && item.reason.$type === 'app.bsky.feed.defs#reasonRepost') {
			if (last) {
				last.push(item);
			} else {
				(slices ||= []).push({ items: (last = [item]) });
			}
		} else {
			last = undefined;
		}
	}

	return slices;
};
