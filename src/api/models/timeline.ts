import { type SignalizedTimelinePost, createSignalizedTimelinePost } from '../cache/posts.ts';
import { type BskyTimelinePost } from '../types.ts';

export interface TimelineSlice {
	items: SignalizedTimelinePost[];
}

const isNextInThread = (slice: TimelineSlice, item: BskyTimelinePost) => {
	const items = slice.items;
	const last = items[items.length - 1];

	const reply = item.reply;

	return !!reply && last.post.cid == reply.parent.cid;
};

const isFirstInThread = (slice: TimelineSlice, item: BskyTimelinePost) => {
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
export type PostFilter = (post: BskyTimelinePost) => boolean;

export const createTimelineSlices = (
	arr: BskyTimelinePost[],
	sliceFilter?: SliceFilter,
	postFilter?: PostFilter,
) => {
	const key = Date.now();

	const seen = new Set<string>();
	let slices: TimelineSlice[] = [];
	let jlen = 0;

	// arrange the posts into connected slices
	loop: for (let i = arr.length - 1; i >= 0; i--) {
		const item = arr[i];
		const cid = item.post.cid;

		// skip any posts that have been seen already
		if (seen.has(cid)) {
			continue;
		}

		seen.add(cid);

		if (postFilter && !postFilter(item)) {
			continue;
		}

		// find a slice that matches
		const signalized = createSignalizedTimelinePost(item, key);

		// if we find a matching slice and it's currently not in front, then bump
		// it to the front. this is so that new reply don't get buried away because
		// there's multiple posts separating it and the parent post.
		for (let j = 0; j < jlen; j++) {
			const slice = slices[j];

			if (isFirstInThread(slice, item)) {
				slice.items.unshift(signalized);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			} else if (isNextInThread(slice, item)) {
				slice.items.push(signalized);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			}
		}

		slices.unshift({ items: [signalized] });
		jlen++;
	}

	if (sliceFilter && jlen > 0) {
		slices = slices.filter((slice) => sliceFilter(slice, seen));
	}

	return slices;
};
