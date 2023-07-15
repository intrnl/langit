import { Show } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { type SignalizedList } from '~/api/cache/lists.ts';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { A } from '~/router.ts';

export interface ListItemProps {
	uid: DID;
	list: SignalizedList;
	onClick?: () => void;
	hideSubscribedBadge?: boolean;
}

const ListItem = (props: ListItemProps) => {
	const uid = () => props.uid;
	const list = () => props.list;

	return (
		<A
			href="/u/:uid/profile/:actor/list/:list"
			params={{ uid: uid(), actor: getRepoId(list().uri), list: getRecordId(list().uri) }}
			onClick={props.onClick}
			class="flex gap-3 px-4 py-3 hover:bg-hinted"
		>
			<div class="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg">
				<Show when={list().avatar.value}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
			</div>

			<div class="flex min-w-0 grow flex-col">
				<div class="text-sm">
					<span class="font-bold">{list().name.value}</span>

					<Show when={list().viewer.muted.value && !props.hideSubscribedBadge}>
						<span class="ml-2 rounded bg-muted px-1 py-px align-[1px] text-xs font-medium">Subscribed</span>
					</Show>
				</div>
				<p class="text-sm text-muted-fg">Mute list by @{list().creator.handle.value}</p>

				<Show when={list().description.value}>
					<div class="mt-1 whitespace-pre-wrap break-words text-sm">{list().$renderedDescription(uid())}</div>
				</Show>
			</div>
		</A>
	);
};

export default ListItem;
