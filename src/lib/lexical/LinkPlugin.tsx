import { AutoLinkPlugin } from 'lexical-solid/LexicalAutoLinkPlugin';

import { hasTld } from '../tlds/index.ts';

const LINK_RE = /(https?:\/\/|)([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)([/][-a-zA-Z0-9()@:%_+.~#?&/=]*)?/;

const LinkPlugin = () => {
	return AutoLinkPlugin({
		matchers: [
			(text) => {
				const match = LINK_RE.exec(text);

				if (match) {
					const link = match[0];
					const proto = match[1];
					const tld = match[3];

					if (!hasTld(tld.slice(1))) {
						return null;
					}

					return {
						index: match.index,
						length: link.length,
						text: link,
						url: !proto ? `https://${link}` : link,
					};
				}

				return null;
			},
		],
	});
};

export default LinkPlugin;
