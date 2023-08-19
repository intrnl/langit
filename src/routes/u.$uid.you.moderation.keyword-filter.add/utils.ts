import type { ModerationFilterKeywordOpts } from '~/api/moderation/types.ts';

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
const escape = (str: string) => {
	return str.replace(ESCAPE_RE, '\\$&');
};

const WORD_START_RE = /^[\p{M}\p{L}\p{N}\p{Pc}]/u;
const WORD_END_RE = /[\p{M}\p{L}\p{N}\p{Pc}]$/u;

export const createRegexMatcher = (matchers: ModerationFilterKeywordOpts[]) => {
	let str = '';

	let pfx = '';
	let sfx = '';

	for (let i = 0, l = matchers.length; i < l; i++) {
		const [keyword, whole] = matchers[i];

		str && (str += '|');

		if (whole) {
			pfx = WORD_START_RE.test(keyword) ? '\\b' : '';
			sfx = WORD_END_RE.test(keyword) ? '\\b' : '';

			str += pfx + escape(keyword) + sfx;
		} else {
			str += escape(keyword);
		}
	}

	return str;
};
