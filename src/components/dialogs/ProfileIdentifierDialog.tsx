import { type SignalizedProfile } from '~/api/cache/profiles.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface ProfileIdentifierDialogProps {
	profile: SignalizedProfile;
}

const COLORS = [
	'#800000',
	'#556b2f',
	'#2f4f4f',
	'#b8860b',
	'#8b4513',
	'#000080',
	'#483d8b',
	'#008b8b',
	'#808000',
	'#2e8b57',
	'#800080',
	'#008000',
];

const color = (str: string) => {
	const seed = cyrb53a(str);
	return COLORS[seed % COLORS.length];
};

const chunked = (str: string, size: number): string[] => {
	const chunks: string[] = [];

	for (let idx = 0, len = str.length; idx < len; idx += size) {
		chunks.push(str.slice(idx, idx + size));
	}

	return chunks;
};

const ProfileIdentifierDialog = (props: ProfileIdentifierDialogProps) => {
	const profile = () => props.profile;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>User identifier for @{profile().handle.value}</h1>

			<div class="mb-2 mt-4 flex flex-wrap justify-center gap-3 rounded bg-white p-4 font-mono text-base font-bold text-black">
				{(() => {
					const [_prefix, method, id] = profile().did.split(':');

					if (method === 'plc') {
						return chunked(id, 4).map((part) => {
							const span = document.createElement('span');

							span.textContent = part;
							span.style.color = color(part);

							return span;
						});
					}

					return id;
				})()}
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button
					onClick={() => {
						navigator.clipboard.writeText(profile().did);
					}}
					class={/* @once */ button({ color: 'outline' })}
				>
					Copy DID
				</button>

				<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
					Close
				</button>
			</div>
		</div>
	);
};

export default ProfileIdentifierDialog;

/**
 * cyrb53a (c) 2023 bryc (github.com/bryc)
 * https://github.com/bryc/code/blob/6ea6fb59526d6e24d815cb076434868bbd5b8892/jshash/experimental/cyrb53.js
 */
export const cyrb53a = (str: string, seed = 0) => {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;

	for (let i = 0, ch; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 0x85ebca77);
		h2 = Math.imul(h2 ^ ch, 0xc2b2ae3d);
	}

	h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
	h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
	h1 ^= h2 >>> 16;
	h2 ^= h1 >>> 16;

	return 2097152 * (h2 >>> 0) + (h1 >>> 11);
};
