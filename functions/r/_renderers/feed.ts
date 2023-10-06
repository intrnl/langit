import { escape } from '../_global.ts';
import { getDid, getFeedGenerator } from '../_resolvers.ts';

import { renderBase } from './base.ts';

export const renderFeed = async (actor: string, id: string) => {
	const did = await getDid(actor);
	const feed = await getFeedGenerator(`at://${did}/app.bsky.feed.generator/${id}`);

	const author = feed.creator;
	const avatar = feed.avatar;
	const description = feed.description;

	let head = renderBase();
	let text = '';

	text += `Feed by ${author.displayName ? `${author.displayName} (@${author.handle})` : `@${author.handle}`}`;
	if (description) {
		text += `\n\n${description};`;
	}

	head += `<meta property="og:title" content="${escape(feed.displayName, true)}" />`;
	head += `<meta property="og:description" content="${escape(text, true)}" />`;

	if (avatar) {
		head += `<meta property="og:image" content="${escape(avatar, true)}" />`;
	}

	return head;
};
