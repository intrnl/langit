import { Show } from 'solid-js';

import type { DID, UnionOf } from '@externdefs/bluesky-client/atp-schema';

import { getRecordId } from '~/api/utils.ts';

import { generatePath } from '~/router.ts';
import { ListPurposeLabels } from '~/api/display';

type EmbeddedList = UnionOf<'app.bsky.graph.defs#listView'>;

export interface EmbedListProps {
	uid: DID;
	list: EmbeddedList;
}

const EmbedList = (props: EmbedListProps) => {
	const uid = () => props.uid;
	const list = () => props.list;

	const purpose = () => {
		const raw = list().purpose;
		return raw in ListPurposeLabels ? ListPurposeLabels[raw] : `Unknown list`;
	};

	return (
		<a
			link
			href={generatePath('/u/:uid/profile/:actor/lists/:list', {
				uid: uid(),
				actor: list().creator.did,
				list: getRecordId(list().uri),
			})}
			class="flex flex-col gap-2 rounded-md border border-divider p-3 text-sm hover:bg-secondary"
		>
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
					<Show when={list().avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
				</div>

				<div>
					<p class="font-bold">{list().name}</p>
					<p class="text-muted-fg">
						{purpose()} by @{list().creator.handle}
					</p>
				</div>
			</div>
		</a>
	);
};

export default EmbedList;
