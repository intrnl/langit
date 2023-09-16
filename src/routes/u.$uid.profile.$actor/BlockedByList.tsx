import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { Match, Switch } from 'solid-js';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import { getList, getListKey } from '~/api/queries/get-list.ts';

import { getCollectionId, getRecordId, getRepoId } from '~/api/utils.ts';

import { generatePath } from '~/router.ts';

// When blocking via a list, it makes `blocking` point to a list URI instead of
// blocks, which makes sense. Unfortunately we aren't being given any basic info
// with regards to the list unlike mutes which provides them via `mutedByList`

export const isBlockedByList = (profile: SignalizedProfile) => {
	const blocking = profile.viewer.blocking.value;
	return blocking && getCollectionId(blocking) === 'app.bsky.graph.list' ? blocking : undefined;
};

export const BlockedByList = (props: { uid: DID; uri: string }) => {
	const uid = () => props.uid;
	const uri = () => props.uri;

	const [list] = createQuery({
		key: () => getListKey(uid(), getRepoId(uri()), getRecordId(uri()), 1),
		fetch: getList,
		staleTime: 60_000,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return (
		<div class="text-sm text-muted-fg">
			<Switch>
				<Match when={list()?.pages[0]} keyed>
					{(page) => {
						const list = page.list;

						return (
							<p>
								This user is blocked by{' '}
								<a
									link
									href={generatePath('/u/:uid/profile/:actor/lists/:list', {
										uid: uid(),
										actor: getRepoId(list.uri),
										list: getRecordId(list.uri),
									})}
									class="text-accent hover:underline"
								>
									{list.name.value}
								</a>
							</p>
						);
					}}
				</Match>

				<Match when={list.error}>
					<p>This user is blocked by a list, but we failed to retrieve it.</p>
				</Match>

				<Match when>
					<p>Retrieving block information...</p>
				</Match>
			</Switch>
		</div>
	);
};
