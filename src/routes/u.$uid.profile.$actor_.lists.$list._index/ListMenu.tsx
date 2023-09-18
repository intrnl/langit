import { Match, Switch } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { SignalizedList } from '~/api/cache/lists.ts';

import { getRecordId } from '~/api/utils.ts';

import { closeModal, openModal } from '~/globals/modals.tsx';

import ReportDialog, { REPORT_LIST } from '~/components/dialogs/ReportDialog.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import DeleteIcon from '~/icons/baseline-delete.tsx';
import LaunchIcon from '~/icons/baseline-launch.tsx';
import ReportIcon from '~/icons/baseline-report.tsx';

import DeleteListDialog from './DeleteListDialog.tsx';

export interface ListMenuProps {
	uid: DID;
	list: SignalizedList;
}

const ListMenu = (props: ListMenuProps) => {
	const uid = () => props.uid;
	const list = () => props.list;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					const $list = list();

					open(`https://bsky.app/profile/${$list.creator.did}/lists/${getRecordId($list.uri)}`, '_blank');
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<LaunchIcon class="text-lg" />
				<span>Open in Bluesky app</span>
			</button>

			<Switch>
				<Match when={list().creator.did === uid()}>
					<button
						onClick={() => {
							closeModal();
							openModal(() => <DeleteListDialog uid={uid()} list={list()} />);
						}}
						class={/* @once */ menu.item()}
					>
						<DeleteIcon class="text-lg" />
						<span>Delete list</span>
					</button>
				</Match>

				<Match when>
					<button
						onClick={() => {
							closeModal();
							openModal(() => (
								<ReportDialog
									uid={uid()}
									report={{ type: REPORT_LIST, uri: list().uri, cid: list().cid.value }}
								/>
							));
						}}
						class={/* @once */ menu.item()}
					>
						<ReportIcon class="text-lg" />
						<span>Report list</span>
					</button>
				</Match>
			</Switch>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default ListMenu;
