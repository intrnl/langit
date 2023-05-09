import * as fs from 'node:fs';
import * as path from 'node:path';

export function findConfig (
	dir: string,
	basename: string,
	extensions: string[],
): string | undefined {
	for (let ext of extensions) {
		const name = basename + ext;
		const file = path.join(dir, name);

		if (fs.existsSync(file)) {
			return file;
		}
	}

	return undefined;
}
