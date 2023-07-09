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
	let seed = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		seed += str.charCodeAt(idx);
	}

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
