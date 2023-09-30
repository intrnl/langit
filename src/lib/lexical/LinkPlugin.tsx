import { AutoLinkPlugin } from './AutoLinkPlugin.tsx';

const ABS_LINK_RE = /https?:\/\/[\S]+/;
const TRAILING_RE = /(?:(?<!\(.*)\))?[.,;]*$/;

const LinkPlugin = () => {
	return AutoLinkPlugin({
		matchers: [
			(text) => {
				const match = ABS_LINK_RE.exec(text);

				if (match) {
					const idx = match.index;

					if (idx > 0 && text[idx - 1] === '@') {
						return null;
					}

					const uri = match[0].replace(TRAILING_RE, '');

					return {
						index: idx,
						length: uri.length,
						text: uri,
						url: uri,
					};
				}

				return null;
			},
		],
	});
};

export default LinkPlugin;
