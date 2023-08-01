import { escape, getBlobUrl } from '../_global.ts';
import { resolveRecord, resolveRepository } from '../_resolvers.ts';

import { renderBase } from './base.ts';

export const renderFeed = async (actor: string, id: string) => {
	const repo = await resolveRepository(actor);

	const [profile, feed] = await Promise.all([
		resolveRecord(repo.did, 'app.bsky.actor.profile', 'self', true),
		resolveRecord(repo.did, 'app.bsky.feed.generator', id),
	]);

	const description = feed.description;
	const avatar = feed.avatar;

	let head = renderBase();
	let text = '';

	text += `Feed by ${profile?.displayName ? `${profile.displayName} (@${repo.handle})` : `@${repo.handle}`}`;
	if (description) {
		text += `\n\n${description}`;
	}

	head += `<meta property="og:title" content="${escape(feed.displayName, true)}" />`;
	head += `<meta property="og:description" content="${escape(text, true)}" />`;

	if (avatar) {
		const url = getBlobUrl(repo.did, avatar);

		head += `<meta property="og:image" content="${escape(url, true)}" />`;
	}

	return head;
};
