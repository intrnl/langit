import { Match, Switch } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import { blockProfile } from '~/api/mutations/block-profile.ts';
import { getList, getListKey } from '~/api/queries/get-list.ts';

import { getCollectionId, getRecordId, getRepoId } from '~/api/utils.ts';

import { closeModal } from '~/globals/modals.tsx';

import CircularProgress from '~/components/CircularProgress.tsx';
import ConfirmDialog from '~/components/dialogs/ConfirmDialog.tsx';
import ListItem from '~/components/ListItem.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface BlockConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

export const isBlockedByList = (profile: SignalizedProfile) => {
	const blocking = profile.viewer.blocking.value;
	return blocking && getCollectionId(blocking) === 'app.bsky.graph.list' ? blocking : undefined;
};

const BlockConfirmDialog = (props: BlockConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const blocking = () => profile().viewer.blocking.value;

	return (
		<Switch>
			<Match when={isBlockedByList(profile())}>
				{(uri) => {
					const [list] = createQuery({
						key: () => getListKey(uid(), getRepoId(uri()), getRecordId(uri()), 1),
						fetch: getList,
						staleTime: 60_000,
						refetchOnReconnect: false,
						refetchOnWindowFocus: false,
					});

					return (
						<div class={/* @once */ dialog.content()}>
							<h1 class={/* @once */ dialog.title()}>Cannot unblock this user</h1>

							<p class="mt-3 text-sm">
								We can't unblock <strong>@{profile().handle.value}</strong> because you've chosen to block
								users on this list:
							</p>

							<div class="mt-3 rounded-md border border-divider">
								<Switch>
									<Match when={list()?.pages[0]}>
										{(data) => (
											<ListItem uid={uid()} list={data().list} hideSubscribedBadge onClick={closeModal} />
										)}
									</Match>

									<Match when>
										<div class="flex justify-center p-3">
											<CircularProgress />
										</div>
									</Match>
								</Switch>
							</div>

							<div class={/* @once */ dialog.actions()}>
								<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
									Ok
								</button>
							</div>
						</div>
					);
				}}
			</Match>

			<Match when>
				<ConfirmDialog
					title={`${blocking() ? 'Unblock' : 'Block'} @${profile().handle.value}?`}
					body={
						blocking()
							? `They will be allowed to view your posts, and interact with you.`
							: `They will not be able to view your posts, mention you, or otherwise interact with you, and you will not see posts or replies from @${
									profile().handle.value
							  }.`
					}
					confirmation={blocking() ? `Unblock` : `Block`}
					onConfirm={() => blockProfile(uid(), profile())}
				/>
			</Match>
		</Switch>
	);
};

export default BlockConfirmDialog;
