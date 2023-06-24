import { CODE2_TO_CODE3 } from '~/utils/intl/languages.ts';

export const systemLanguages: string[] = [];

for (const lang of navigator.languages) {
	const index = lang.indexOf('-');
	const code2 = index !== -1 ? lang.slice(0, index) : lang;

	const code3 = CODE2_TO_CODE3[code2];

	if (!code3 || systemLanguages.includes(code3)) {
		continue;
	}

	systemLanguages.push(code3);
}
