import { type DID } from '~/api/utils.ts';

import { type SignalizedList } from '~/api/cache/lists.ts';
import { subscribeMuteList } from '~/api/mutations/subscribe-mute-list.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface SubscribeListConfirmDialogProps {
	uid: DID;
	list: SignalizedList;
}

const SubscribeListConfirmDialog = (props: SubscribeListConfirmDialogProps) => {
	const list = () => props.list;

	const isMuted = () => list().viewer.muted.value;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>
				{isMuted() ? 'Unsubscribe from' : 'Subscribe to'} "{list().name.value}"?
			</h1>

			{isMuted() ? (
				<p class="mt-3 text-sm">
					Posts from users added to this list will be allowed to show in your home timeline.
				</p>
			) : (
				<p class="mt-3 text-sm">
					Any users in this list, present or future, will be muted. Their posts will no longer show up in your
					home timeline, but it will still allow them to see your posts and follow you.
				</p>
			)}

			<div class={/* @once */ dialog.actions()}>
				<button
					onClick={() => {
						closeModal();
					}}
					class={/* @once */ button({ color: 'ghost' })}
				>
					Cancel
				</button>
				<button
					onClick={() => {
						closeModal();
						subscribeMuteList(props.uid, list());
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					{isMuted() ? 'Unmute' : 'Mute'}
				</button>
			</div>
		</div>
	);
};

export default SubscribeListConfirmDialog;
