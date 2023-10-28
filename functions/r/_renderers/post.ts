import type { Records, RefOf } from '@externdefs/bluesky-client/atp-schema';

import { escape } from '../_global.ts';
import { getDid, getPostThread } from '../_resolvers.ts';

import { renderBase } from './base.ts';

export const renderPost = async (actor: string, tid: string) => {
	const did = await getDid(actor);
	const thread = await getPostThread(`at://${did}/app.bsky.feed.post/${tid}`, 1, 1);

	if (thread.$type !== 'app.bsky.feed.defs#threadViewPost') {
		return '';
	}

	const parent = thread.parent;
	const post = thread.post;

	const author = post.author;
	const embed = post.embed;
	const record = post.record as Records['app.bsky.feed.post'];

	const title = author.displayName ? `${author.displayName} (@${author.handle})` : `@${author.handle}`;

	let head = renderBase();

	let header = '';
	let text = record.text;

	if (parent) {
		if (parent.$type === 'app.bsky.feed.defs#threadViewPost') {
			const repliedTo = parent.post.author;

			header += `[replying to @${repliedTo.handle}]`;
		} else {
			header += `[reply: not found] `;
		}
	}

	if (embed) {
		const $type = embed.$type;

		let images: RefOf<'app.bsky.embed.images#viewImage'>[] | undefined;
		let record: RefOf<'app.bsky.embed.record#viewRecord'> | null | undefined;

		if ($type === 'app.bsky.embed.images#view') {
			images = embed.images;
		} else if ($type === 'app.bsky.embed.recordWithMedia#view') {
			const med = embed.media;

			const rec = embed.record.record;
			const rectype = rec.$type;

			if (med.$type === 'app.bsky.embed.images#view') {
				images = med.images;
			}

			if (getCollectionId(rec.uri) === 'app.bsky.feed.post') {
				if (rectype === 'app.bsky.embed.record#viewRecord') {
					record = rec;
				} else {
					record = null;
				}
			}
		} else if ($type === 'app.bsky.embed.record#view') {
			const rec = embed.record;
			const rectype = rec.$type;

			if (getCollectionId(rec.uri) === 'app.bsky.feed.post') {
				if (rectype === 'app.bsky.embed.record#viewRecord') {
					record = rec;
				} else {
					record = null;
				}
			}
		}

		if (images) {
			const img = images[0];
			const url = img.fullsize;

			head += `<meta name="twitter:card" content="summary_large_image" />`;
			head += `<meta property="og:image" content="${escape(url, true)}" />`;
		}

		if (record) {
			header += `[quoting @${record.author.handle}] `;
		} else if (record === null) {
			header += `[quote: not found]`;
		}
	}

	if (header) {
		text = `${header}\n\n${text}`;
	}

	head += `<meta property="og:title" content="${escape(title, true)}" />`;
	head += `<meta property="og:description" content="${escape(text, true)}" />`;

	return head;
};

const getCollectionId = (uri: string) => {
	const first = uri.indexOf('/', 5);
	const second = uri.indexOf('/', first + 1);

	return uri.slice(first + 1, second);
};
