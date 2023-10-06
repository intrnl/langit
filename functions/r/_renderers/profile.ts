import { escape } from '../_global.ts';
import { getProfile } from '../_resolvers.ts';

import { renderBase } from './base.ts';

export const renderProfile = async (actor: string) => {
	const author = await getProfile(actor);

	const title = author.displayName ? `${author.displayName} (@${author.handle})` : `@${author.handle}`;

	let head = renderBase();
	head += `<meta property="og:title" content="${escape(title, true)}" />`;

	const avatar = author.avatar;
	const description = author.description;

	if (avatar) {
		head += `<meta property="og:image" content="${escape(avatar, true)}" />`;
	}
	if (description) {
		head += `<meta property="og:description" content="${escape(description, true)}" />`;
	}

	return head;
};
