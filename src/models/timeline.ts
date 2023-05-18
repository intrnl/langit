import { signalizePost } from '~/api/cache.ts';
import { type BskyTimelineResponse, type SignalizedTimelinePost } from '~/api/types.ts';

export interface TimelineSlice {
	items: SignalizedTimelinePost[];
}

const isNextInThread = (slice: TimelineSlice, item: SignalizedTimelinePost) => {
	const items = slice.items;
	const last = items[items.length - 1];

	return !!item.reply && (last.post.peek().cid === item.reply.parent.peek().cid);
};

const isFirstInThread = (slice: TimelineSlice, item: SignalizedTimelinePost) => {
	const items = slice.items;
	const first = items[0];

	return !!first.reply && (first.reply.parent.peek().cid === item.post.peek().cid);
};

export interface TimelinePage {
	cursor?: string;
	cid?: string;
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

		const post = item.post;
		const reply = item.reply;

		feed[idx] = {
			post: signalizePost(post, key),
			reply: reply && {
				root: signalizePost(reply.root, key),
				parent: signalizePost(reply.parent, key),
			},
			reason: item.reason,
		};
	}

	const seen = new Set<string>();
	let slices: TimelineSlice[] = [];
	let jlen = 0;

	// arrange the posts into connected slices
	loop:
	for (let i = feed.length - 1; i >= 0; i--) {
		const item = feed[i];

		// skip any posts that have been seen already
		if (seen.has(item.post.peek().cid)) {
			continue;
		}

		seen.add(item.post.peek().cid);

		// find a slice that matches

		// if we find a matching slice and it's currently not in front, then bump
		// it to the front. this is so that new reply don't get buried away because
		// there's multiple posts separating it and the parent post.
		for (let j = 0; j < jlen; j++) {
			const slice = slices[j];

			if (isNextInThread(slice, item)) {
				slice.items.push(item);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			}
			else if (isFirstInThread(slice, item)) {
				slice.items.unshift(item);

				if (j !== 0) {
					slices.splice(j, 1);
					slices.unshift(slice);
				}

				continue loop;
			}
		}

		slices.unshift({ items: [item] });
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
		slices,
	};
};
