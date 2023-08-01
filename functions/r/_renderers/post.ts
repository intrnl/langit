import { RefOf } from '@intrnl/bluesky-client/atp-schema';

import { INSTANCE_URL, escape } from '../_global.ts';
import { resolvePost, resolveProfile, resolveRepository } from '../_resolvers.ts';

import { renderBase } from './base.ts';

export const renderPost = async (actor: string, tid: string) => {
	const repo = await resolveRepository(actor);

	const [profile, post] = await Promise.all([resolveProfile(repo.did), resolvePost(repo.did, tid)]);

	const embed = post.embed;
	const title = profile?.displayName ? `${profile.displayName} (@${repo.handle})` : `@${repo.handle}`;

	let head = renderBase();

	let header = '';
	let text = post.text;

	if (embed) {
		const $type = embed.$type;

		let images: RefOf<'app.bsky.embed.images#image'>[] | undefined;
		let record: string | undefined;

		if ($type === 'app.bsky.embed.images') {
			images = embed.images;
		} else if ($type === 'app.bsky.embed.recordWithMedia') {
			const media = embed.media;

			if (media.$type === 'app.bsky.embed.images') {
				images = media.images;
			}

			record = embed.record.record.uri;
		} else if ($type === 'app.bsky.embed.record') {
			record = embed.record.uri;
		}

		if (images) {
			const img = images[0];
			const url = `${INSTANCE_URL}/xrpc/com.atproto.sync.getBlob?did=${repo.did}&cid=${img.image.ref.$link}`;
			head += `<meta name="twitter:card" content="summary_large_image" />`;
			head += `<meta property="og:image" content="${escape(url, true)}" />`;
		}

		if (record && getCollectionId(record) === 'app.bsky.feed.post') {
			try {
				const quotedRepo = await resolveRepository(getRepoId(record));

				header += `[quoting @${quotedRepo.handle}] `;
			} catch (err) {
				console.log(`failed to resolve quote ${record}`);
				console.error(err);

				header += `[quote: failed to resolve quote] `;
			}
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

const getRepoId = (uri: string) => {
	const idx = uri.indexOf('/', 5);
	return uri.slice(5, idx);
};
