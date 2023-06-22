import { For, Match, Show, Switch, createSignal } from 'solid-js';

import { createInfiniteQuery, createQuery } from '@tanstack/solid-query';

import { type DID, getRecordId } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';
import { getProfileInList, getProfileInListKey } from '~/api/queries/get-profile-in-list.ts';

import { multiagent } from '~/globals/agent.ts';
import { useModalState } from '~/globals/modals.tsx';
import { createDerivedSignal } from '~/utils/hooks.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

import CheckIcon from '~/icons/baseline-check.tsx';

export interface AddProfileListDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

const PAGE_SIZE = 30;

type PendingItem = [list: string, record: string | null];

const AddProfileListDialog = (props: AddProfileListDialogProps) => {
	let listEl: HTMLDivElement | undefined;

	const { close } = useModalState();

	const [mutating, setMutating] = createSignal(false);

	const uid = () => props.uid;
	const profile = () => props.profile;

	const listQuery = createInfiniteQuery({
		queryKey: () => getProfileListsKey(uid(), uid(), PAGE_SIZE),
		queryFn: getProfileLists,
		getNextPageParam: (last) => last.cursor,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const submit = async () => {
		const pending: PendingItem[] = [];

		for (const btn of listEl!.querySelectorAll<HTMLButtonElement>(':scope > button[data-list-uri]')) {
			const uri = btn.getAttribute('data-list-uri')!;

			const record = btn.getAttribute('data-record-uri');
			const value = btn.getAttribute('aria-pressed')!;

			const bool = value === 'true';

			if (bool === !!record) {
				continue;
			}

			pending.push([uri, record]);
		}

		setMutating(true);

		const $uid = uid();
		const $profile = profile();

		const date = new Date().toISOString();

		const agent = await multiagent.connect($uid);

		const promises = pending.map(([list, record]) => {
			if (record) {
				return agent.rpc.post({
					method: 'com.atproto.repo.deleteRecord',
					data: {
						collection: 'app.bsky.graph.listitem',
						repo: $uid,
						rkey: getRecordId(record),
					},
				});
			} else {
				return agent.rpc.post({
					method: 'com.atproto.repo.createRecord',
					data: {
						collection: 'app.bsky.graph.listitem',
						repo: $uid,
						record: {
							$type: 'app.bsky.graph.listitem',
							list: list,
							subject: $profile.did,
							createdAt: date,
						},
					},
				});
			}
		});

		await Promise.allSettled(promises);

		setMutating(false);
		close();
	};

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Add to list</h1>

			<div ref={listEl} class="-mx-4 mt-3 flex flex-col overflow-y-auto">
				<For each={listQuery.data?.pages}>
					{(page) => {
						return page.lists.map((list) => {
							const query = createQuery({
								queryKey: () => getProfileInListKey(uid(), profile().did, list.uri),
								queryFn: getProfileInList,
								refetchOnReconnect: false,
								refetchOnWindowFocus: false,
							});

							const loading = () => query.isFetching || !query.data;
							const [checked, setChecked] = createDerivedSignal(() => !!query.data?.exists);

							return (
								<button
									disabled={loading()}
									class="flex items-center gap-3 px-4 py-3 text-left hover:bg-hinted"
									classList={{ 'opacity-50 pointer-events-none': loading() }}
									data-list-uri={list.uri}
									data-record-uri={query.data?.exists}
									aria-pressed={checked()}
									onClick={() => setChecked(!checked())}
								>
									<div class="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg">
										<Show when={list.avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>

									<div class="min-w-0 grow">
										<p class="break-words text-sm font-bold">{list.name.value}</p>
										<p class="text-sm text-muted-fg">Mute list</p>
									</div>

									<Show when={checked()}>
										<CheckIcon class="text-xl text-accent" />
									</Show>
								</button>
							);
						});
					}}
				</For>

				<Switch>
					<Match when={listQuery.isInitialLoading || listQuery.isFetchingNextPage}>
						<div class="flex h-13 items-center justify-center border-divider">
							<CircularProgress />
						</div>
					</Match>

					<Match when={listQuery.hasNextPage}>
						<button
							onClick={() => listQuery.fetchNextPage()}
							disabled={listQuery.isRefetching}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					</Match>
				</Switch>
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={close} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button disabled={mutating()} onClick={submit} class={/* @once */ button({ color: 'primary' })}>
					Save
				</button>
			</div>
		</div>
	);
};

export default AddProfileListDialog;
