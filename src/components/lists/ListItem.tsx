import { Show } from 'solid-js';

import type { DID, RefOf } from '@externdefs/bluesky-client/atp-schema';

import { type SignalizedList } from '~/api/cache/lists.ts';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { generatePath } from '~/router.ts';

export interface ListItemProps {
	uid: DID;
	list: SignalizedList;
	onClick?: () => void;
	hideSubscribedBadge?: boolean;
}

type ListPurpose = RefOf<'app.bsky.graph.defs#listPurpose'>;

const ListPurposeLabels: Record<ListPurpose, string> = {
	'app.bsky.graph.defs#modlist': 'Moderation list',
	'app.bsky.graph.defs#curatelist': 'Curation list',
};

const ListItem = (props: ListItemProps) => {
	const uid = () => props.uid;
	const list = () => props.list;

	const purpose = () => {
		const raw = list().purpose.value;
		return raw in ListPurposeLabels ? ListPurposeLabels[raw] : `Unknown list`;
	};

	const isSubscribed = () => {
		return list().viewer.muted.value || !!list().viewer.blocked.value;
	};

	return (
		<a
			link
			href={generatePath('/u/:uid/profile/:actor/lists/:list', {
				uid: uid(),
				actor: getRepoId(list().uri),
				list: getRecordId(list().uri),
			})}
			onClick={props.onClick}
			class="flex gap-3 px-4 py-3 hover:bg-hinted"
		>
			<div class="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg">
				<Show when={list().avatar.value}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
			</div>

			<div class="flex min-w-0 grow flex-col">
				<div class="text-sm">
					<span class="font-bold">{list().name.value}</span>

					<Show when={isSubscribed() && !props.hideSubscribedBadge}>
						<span class="ml-2 rounded bg-muted px-1 py-px align-[1px] text-xs font-medium">Subscribed</span>
					</Show>
				</div>
				<p class="text-sm text-muted-fg">
					{purpose()} by @{list().creator.handle.value}
				</p>

				<Show when={list().description.value}>
					<div class="mt-1 whitespace-pre-wrap break-words text-sm">{list().$renderedDescription()}</div>
				</Show>
			</div>
		</a>
	);
};

export default ListItem;

export const createListItemKey = (list: SignalizedList) => {
	return 'list/' + list.uri;
};
