import { createMemo } from 'solid-js';
import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { closeModal } from '~/globals/modals.tsx';
import { getAccountModerationPreferences } from '~/globals/preferences.ts';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

import { type Labeler, LABELERS } from './types.ts';

export interface AddLabelerDialogProps {
	uid: DID;
	onPick: (labeler: Labeler) => void;
}

const AddLabelerDialog = (props: AddLabelerDialogProps) => {
	const prefs = createMemo(() => {
		return getAccountModerationPreferences(props.uid).labelers;
	});

	const bindChooseLabeler = (labeler: Labeler) => () => {
		props.onPick(labeler);
		closeModal();
	};

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Add label provider</h1>

			<div class="-mx-4 mt-3 flex flex-col overflow-y-auto">
				{LABELERS.map((labeler) => (
					<button
						onClick={bindChooseLabeler(labeler)}
						disabled={!!prefs()[labeler.did]}
						class="flex items-center gap-3 px-4 py-3 text-left hover:bg-hinted disabled:pointer-events-none disabled:opacity-50"
					>
						<div class="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg"></div>

						<div class="min-w-0 grow">
							<p class="break-words text-sm font-bold">{labeler.name}</p>
							<p class="text-sm text-muted-fg">@{labeler.handle}</p>
						</div>
					</button>
				))}
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
			</div>
		</div>
	);
};

export default AddLabelerDialog;
