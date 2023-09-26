import { AutoLinkPlugin } from './AutoLinkPlugin.tsx';

import { hasTld } from '../tlds/index.ts';

const LINK_RE = /(https?:\/\/[\S]+)|([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(\/[\S]*)?/;

const PUNCTUATION_RE = /[.,;!?]$/;
const PAREN_RE = /[)]$/;

const LinkPlugin = () => {
	return AutoLinkPlugin({
		matchers: [
			(text) => {
				const match = LINK_RE.exec(text);

				if (match) {
					const idx = match.index;
					let uri = match[0];

					if (match[1]) {
						return {
							index: idx,
							length: uri.length,
							text: uri,
							url: uri,
						};
					}

					const tld = match[3];
					const pathname = match[4];

					if (idx > 0 && text[idx - 1] === '@') {
						return null;
					}

					if (!hasTld(tld.slice(1))) {
						return null;
					}

					if (PUNCTUATION_RE.test(pathname)) {
						uri = uri.slice(0, -1);
					}
					if (PAREN_RE.test(pathname) && !pathname.includes('(')) {
						uri = uri.slice(0, -1);
					}

					return {
						index: idx,
						length: uri.length,
						text: uri,
						url: `https://${uri}`,
					};
				}

				return null;
			},
		],
	});
};

export default LinkPlugin;
