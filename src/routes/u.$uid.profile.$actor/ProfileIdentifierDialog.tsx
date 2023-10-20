import type { SignalizedProfile } from '~/api/cache/profiles.ts';

import { closeModal, replaceModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

import ContentCopyIcon from '~/icons/baseline-content-copy.tsx';
import HistoryIcon from '~/icons/baseline-history.tsx';

import IdentifierHistoryDialog from './IdentifierHistoryDialog.tsx';

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

const renderPart = (part: string) => {
	const span = document.createElement('span');

	span.textContent = part;
	span.style.backgroundColor = color(part);
	span.className = `text-white px-1.5 py-1 rounded`;

	return span;
};

const ProfileIdentifierDialog = (props: ProfileIdentifierDialogProps) => {
	const profile = () => props.profile;

	return (
		<div class={/* @once */ menu.content()}>
			<h1 class={/* @once */ menu.title()}>User identifier</h1>

			<div class="mb-2 flex flex-wrap justify-center gap-1 rounded py-2 font-mono text-base font-bold">
				{(() => {
					const [_prefix, method, id] = profile().did.split(':');

					if (method === 'plc') {
						return chunked(id, 4).map(renderPart);
					}

					return renderPart(id);
				})()}
			</div>

			<button
				class={/* @once */ menu.item()}
				onClick={() => {
					replaceModal(() => <IdentifierHistoryDialog profile={props.profile} />);
				}}
			>
				<HistoryIcon class="text-lg" />
				<span>View handle history</span>
			</button>

			<button
				class={/* @once */ menu.item()}
				onClick={() => {
					closeModal();
					navigator.clipboard.writeText(profile().did);
				}}
			>
				<ContentCopyIcon class="text-lg" />
				<span>Copy DID</span>
			</button>

			<button
				class={/* @once */ menu.item()}
				onClick={() => {
					closeModal();
					navigator.clipboard.writeText(profile().handle.value);
				}}
			>
				<ContentCopyIcon class="text-lg" />
				<span>Copy @{profile().handle.value}</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default ProfileIdentifierDialog;
