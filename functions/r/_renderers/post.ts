import { RefOf } from '@intrnl/bluesky-client/atp-schema';

import { INSTANCE_URL, escape } from '../_global.ts';
import { resolvePost, resolveProfile, resolveRepository } from '../_resolvers.ts';

export const renderPost = (
	post: Awaited<ReturnType<typeof resolvePost>>,
	profile: Awaited<ReturnType<typeof resolveProfile>>,
	repo: Awaited<ReturnType<typeof resolveRepository>>,
) => {
	const embed = post.embed;

	const title = profile?.displayName ? `${profile.displayName} (${repo.handle})` : repo.handle;
	let image = '';

	if (embed) {
		const $type = embed.$type;

		let images: RefOf<'app.bsky.embed.images#image'>[] | undefined;

		if ($type === 'app.bsky.embed.images') {
			images = embed.images;
		} else if ($type === 'app.bsky.embed.recordWithMedia') {
			const media = embed.media;

			if (media.$type === 'app.bsky.embed.images') {
				images = media.images;
			}
		}

		if (images) {
			const tags = images.map((img) => {
				const url = `${INSTANCE_URL}/xrpc/com.atproto.sync.getBlob?did=${repo.did}&cid=${img.image.ref.$link}`;
				return `<meta property="og:image" content="${escape(url, true)}" />`;
			});

			image = `<meta name="twitter:card" content="summary_large_image" />` + tags.join('');
		}
	}

	return `
		<meta name="theme-color" content="#0085ff" />
		<meta property="og:site_name" content="Langit" />
		<meta property="og:title" content="${escape(title, true)}" />
		<meta property="og:description" content="${escape(post.text, true)}" />
		${image}
	`;
};
