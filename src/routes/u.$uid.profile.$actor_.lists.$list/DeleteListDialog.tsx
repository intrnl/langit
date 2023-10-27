import { Match, Switch, createRenderEffect, createSignal } from 'solid-js';
import { createMutable } from 'solid-js/store';

import type { DID, Records, UnionOf } from '@externdefs/bluesky-client/atp-schema';

import type { SignalizedList } from '~/api/cache/lists.ts';

import { getCollectionId, getRecordId } from '~/api/utils.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, useModalState } from '~/globals/modals.tsx';
import { useNavigate } from '~/router.ts';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface DeleteListDialogProps {
	uid: DID;
	list: SignalizedList;
}

const enum ProgressionState {
	ONGOING,
	SUCCESS,
	ERROR,
}

interface Progression {
	state: ProgressionState;
	value: number;
	max: number;
	message: string;
}

type ListItemRecord = Records['app.bsky.graph.listitem'];

const serializeError = (err: any) => {
	return err instanceof Error ? err.message : '' + err;
};

const chunked = <T,>(str: T[], size: number): T[][] => {
	const chunks: T[][] = [];

	for (let idx = 0, len = str.length; idx < len; idx += size) {
		chunks.push(str.slice(idx, idx + size));
	}

	return chunks;
};

const DeleteListDialog = (props: DeleteListDialogProps) => {
	// This is a pretty important one, it shouldn't be reactive at all.
	const { uid, list } = props;

	const navigate = useNavigate();
	const modal = useModalState();

	// This should be set with a mutable!
	const [progress, setProgress] = createSignal<Progression>();

	const handleDeletion = async () => {
		const listUri = list.uri;

		const mutable = createMutable<Progression>({
			state: ProgressionState.ONGOING,
			value: 0,
			max: 1,
			message: `Retrieving list members`,
		});

		setProgress(mutable);

		// Retrieve agent
		const agent = await multiagent.connect(uid);

		// Retrieve the list members
		const itemUris: string[] = [];

		try {
			let cursor: string | undefined;

			do {
				const response = await agent.rpc.get('com.atproto.repo.listRecords', {
					params: {
						repo: uid,
						collection: 'app.bsky.graph.listitem',
						cursor: cursor,
						limit: 100,
					},
				});

				const data = response.data;
				const records = data.records;

				for (let i = 0, ilen = records.length; i < ilen; i++) {
					const item = records[i];
					const record = item.value as ListItemRecord;

					if (record.list !== listUri) {
						continue;
					}

					itemUris.push(item.uri);
				}

				cursor = data.cursor;
				mutable.message = `Retrieving list members (${itemUris.length})`;
			} while (cursor);
		} catch (err) {
			mutable.message = `Failed to retrieve list members: ${serializeError(err)}`;
			mutable.state = ProgressionState.ERROR;
			return;
		}

		// Remove all list item members and the list itself
		try {
			const createDeleteOp = (uri: string): UnionOf<'com.atproto.repo.applyWrites#delete'> => {
				const collection = getCollectionId(uri);
				const rkey = getRecordId(uri);

				return {
					$type: 'com.atproto.repo.applyWrites#delete',
					collection: collection,
					rkey: rkey,
				};
			};

			const chunkSize = 10;
			const chunkedUris = chunked(itemUris.concat(listUri), chunkSize);

			const totalUris = itemUris.length + 1;

			mutable.value = 0;
			mutable.max = totalUris;

			for (let i = 0; i < chunkedUris.length; i++) {
				const chunk = chunkedUris[i];

				mutable.message = `Deleting records (${mutable.value}/${totalUris})`;

				await agent.rpc.call('com.atproto.repo.applyWrites', {
					data: {
						repo: uid,
						writes: chunk.map(createDeleteOp),
					},
				});

				mutable.value += chunk.length;
			}

			mutable.value = totalUris;
		} catch (err) {
			mutable.message = `Failed to delete records: ${serializeError(err)}`;
			mutable.state = ProgressionState.ERROR;
			return;
		}

		// We're done.
		mutable.message = `List has been deleted successfully`;
		mutable.state = ProgressionState.SUCCESS;

		// Back away from where we are currently.
		if (history.state) {
			navigate(-1);
		} else {
			navigate('/u/:uid/you/moderation/lists/self', { replace: true, params: { uid } });
		}
	};

	createRenderEffect(() => {
		const $progress = progress();
		modal.disableBackdropClose.value = $progress ? $progress.state == ProgressionState.ONGOING : false;
	});

	return (
		<Switch>
			<Match when={progress()} keyed>
				{(progress) => (
					<div class={/* @once */ dialog.content()}>
						<h1 class={/* @once */ dialog.title()}>Deleting list</h1>

						<p class="mt-3 text-sm">
							<strong>{list.name.value}</strong> is on its way to being deleted...
						</p>

						<div class="mt-3 h-1.5 w-full overflow-hidden rounded bg-hinted">
							<div
								class="h-full bg-accent"
								style={{ width: `${(progress.value / progress.max) * 100}%` }}
							></div>
						</div>

						<p
							class="mt-3 text-sm"
							classList={{
								'text-muted-fg': progress.state !== ProgressionState.ERROR,
								'text-red-600': progress.state === ProgressionState.ERROR,
							}}
						>
							{progress.message}
						</p>

						<div class={/* @once */ dialog.actions()}>
							<button
								disabled={progress.state === ProgressionState.ONGOING}
								onClick={closeModal}
								class={/* @once */ button({ color: 'primary' })}
							>
								Close
							</button>
						</div>
					</div>
				)}
			</Match>

			<Match when>
				<div class={/* @once */ dialog.content()}>
					<h1 class={/* @once */ dialog.title()}>Delete list?</h1>

					<p class="mt-3 text-sm">
						Are you sure you want to delete <strong>{list.name.value}</strong>?
					</p>

					<div class={/* @once */ dialog.actions()}>
						<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
							Cancel
						</button>
						<button onClick={handleDeletion} class={/* @once */ button({ color: 'primary' })}>
							Delete
						</button>
					</div>
				</div>
			</Match>
		</Switch>
	);
};

export default DeleteListDialog;
