import {
	type SignalizedTimelinePost,
	createSignalizedTimelinePost,
	mergeSignalizedPost,
} from '../cache/posts.ts';
import { type BskyPost, type BskyTimelineResponse } from '../types.ts';

export interface TimelineSlice {
	items: SignalizedTimelinePost[];
}

const isNextInThread = (slice: TimelineSlice, item: SignalizedTimelinePost) => {
	const items = slice.items;
	const last = items[items.length - 1];

	const reply = item.reply;

	return !!reply && last.post.cid == reply.parent.cid;
};

const isFirstInThread = (slice: TimelineSlice, item: SignalizedTimelinePost) => {
	const items = slice.items;
	const first = items[0];

	const reply = first.reply;

	return !!reply && reply.parent.cid === item.post.cid;
};

export interface TimelinePage {
	cursor?: string;
	cid?: string;
	length: number;
	slices: TimelineSlice[];
}

export type SliceFilter = (slice: TimelineSlice, seen: Set<string>) => boolean;

export const createTimelinePage = (data: BskyTimelineResponse, filter?: SliceFilter): TimelinePage => {
	const key = Date.now();

	const orig = data.feed;
	const len = orig.length;

	const feed: SignalizedTimelinePost[] = new Array(len);

	for (let idx = 0; idx < len; idx++) {
		const item = orig[idx];
		feed[idx] = createSignalizedTimelinePost(item, key);
	}

	const seen = new Set<string>();
	let slices: TimelineSlice[] = [];
	let jlen = 0;

	// arrange the posts into connected slices
	loop: for (let i = 0; i < len; i++) {
		const item = feed[i];
		const cid = item.post.cid;

		// skip any posts that have been seen already
		if (seen.has(cid)) {
			continue;
		}

		seen.add(cid);

		// find a slice that matches

		// if we find a matching slice and it's currently not in front, then bump
		// it to the front. this is so that new reply don't get buried away because
		// there's multiple posts separating it and the parent post.
		for (let j = 0; j < jlen; j++) {
			const slice = slices[j];

			if (isNextInThread(slice, item)) {
				slice.items.push(item);
				continue loop;
			} else if (isFirstInThread(slice, item)) {
				slice.items.unshift(item);
				continue loop;
			}
		}

		slices.push({ items: [item] });
		jlen++;
	}

	if (filter && jlen > 0) {
		const finalslices: TimelineSlice[] = [];

		for (let i = 0; i < jlen; i++) {
			const slice = slices[i];

			if (filter(slice, seen)) {
				finalslices.push(slice);
			}
		}

		slices = finalslices;
	}

	return {
		cursor: data.cursor,
		cid: len > 0 ? orig[0].post.cid : undefined,
		length: len,
		slices,
	};
};

export const createLikesTimelinePage = (cursor: string, posts: BskyPost[]): TimelinePage => {
	const key = Date.now();

	const len = posts.length;
	const slices: TimelineSlice[] = [];

	for (let idx = 0; idx < len; idx++) {
		const post = posts[idx];
		const signalized = mergeSignalizedPost(post, key);

		slices.push({ items: [{ post: signalized, reason: undefined }] });
	}

	return {
		cursor: cursor,
		cid: len > 0 ? posts[0].cid : undefined,
		length: len,
		slices: slices,
	};
};
