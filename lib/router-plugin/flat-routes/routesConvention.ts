export const routeModuleExts = ['.js', '.jsx', '.ts', '.tsx', '.md', '.mdx'];

export const paramPrefixChar = '$';
export const escapeStart = '[';
export const escapeEnd = ']';

export const optionalStart = '(';
export const optionalEnd = ')';

export const isSegmentSeparator = (checkChar: string | undefined) => {
	if (!checkChar) {
		return false;
	}

	return checkChar === '/' || checkChar === '.' || checkChar === '\\';
};
