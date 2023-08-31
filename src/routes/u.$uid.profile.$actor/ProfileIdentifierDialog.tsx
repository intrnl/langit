import { createSignal } from 'solid-js';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';

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

const hash = (str: string) => {
	let l = str.length;
	let i = 0;
	let h = 5381;

	for (; i < l; i++) {
		h = (h * 33) ^ str.charCodeAt(i);
	}

	return h >>> 0;
};

const color = (str: string) => {
	const seed = hash(str);

	return COLORS[Math.floor(seed) % COLORS.length];
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

	const [copied, setCopied] = createSignal(false);

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>User identifier for @{profile().handle.value}</h1>

			<div class="mb-2 mt-4 flex flex-wrap justify-center gap-1 rounded py-2 font-mono text-base font-bold text-black">
				{(() => {
					const [_prefix, method, id] = profile().did.split(':');

					if (method === 'plc') {
						return chunked(id, 4).map((part) => {
							const span = document.createElement('span');

							span.textContent = part;
							span.style.backgroundColor = color(part);
							span.className = `text-white px-1.5 py-1 rounded`;

							return span;
						});
					}

					return id;
				})()}
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button
					disabled={copied()}
					onClick={() => {
						navigator.clipboard.writeText(profile().did).then(() => {
							setCopied(true);
							setTimeout(() => setCopied(false), 1000);
						});
					}}
					class={/* @once */ button({ color: 'outline' })}
				>
					{!copied() ? 'Copy DID' : 'Copied!'}
				</button>

				<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
					Close
				</button>
			</div>
		</div>
	);
};

export default ProfileIdentifierDialog;
