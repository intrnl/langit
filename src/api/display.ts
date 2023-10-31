export const MAX_DISPLAYNAME_LENGTH = 64;
export const MAX_BIO_LENGTH = 256;

// This regex handles the following:
// - Emojis with more than 3 ZWJ (the currently "valid" emoji sequence currently
//   is the family emojis which has 4 emojis in a sequence)
// - more than 6 of Hangul_Syllable_Type=L and Hangul_Syllable_Type=J, these
//   are non-breaking characters.
const SANITIZE_NAME_RE = /(?<=.(?:\u200d.){3})\u200d.|[\u1100-\ua97c\u11a8-\ud7fb]{6,}/gu;

export const sanitizeDisplayName = (name: string | undefined) => {
	if (name) {
		name = name.replace(SANITIZE_NAME_RE, '');
	}

	return name;
};
