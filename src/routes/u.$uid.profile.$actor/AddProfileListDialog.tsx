import { For, Match, Show, Switch, createSignal } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getCollectionCursor, getRecordId } from '~/api/utils.ts';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import {
	type ProfileExistsResult,
	getProfileInList,
	getProfileInListKey,
} from '~/api/queries/get-profile-in-list.ts';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';

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

const AddProfileListDialog = (props: AddProfileListDialogProps) => {
	let listEl: HTMLDivElement | undefined;

	const { close } = useModalState();

	const [mutating, setMutating] = createSignal(false);

	const uid = () => props.uid;
	const profile = () => props.profile;

	const [lists, { refetch }] = createQuery({
		key: () => getProfileListsKey(uid(), uid(), PAGE_SIZE),
		fetch: getProfileLists,
	});

	const submit = async () => {
		const btns = Array.from(listEl!.querySelectorAll<HTMLButtonElement>(':scope > button'));

		const $uid = uid();
		const $profile = profile();

		const actor = $profile.did;
		const date = new Date().toISOString();

		setMutating(true);

		const agent = await multiagent.connect($uid);

		const promises = btns.map(async (btn) => {
			const result = (btn as any).$data as ProfileExistsResult;

			const uri = result.list;
			const record = result.exists.peek();

			const value = btn.getAttribute('aria-pressed')!;

			const bool = value === 'true';

			if (bool === !!record) {
				return;
			}

			if (record) {
				await agent.rpc.call('com.atproto.repo.deleteRecord', {
					data: {
						collection: 'app.bsky.graph.listitem',
						repo: $uid,
						rkey: getRecordId(record),
					},
				});

				result.exists.value = undefined;
			} else {
				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						collection: 'app.bsky.graph.listitem',
						repo: $uid,
						record: {
							$type: 'app.bsky.graph.listitem',
							list: uri,
							subject: actor,
							createdAt: date,
						},
					},
				});

				result.exists.value = response.data.uri;
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
				<For each={lists()?.pages}>
					{(page) => {
						return page.lists.map((list) => {
							const [result] = createQuery({
								key: () => getProfileInListKey(uid(), profile().did, list.uri),
								fetch: getProfileInList,
							});

							const loading = () => !result() || mutating();
							const [checked, setChecked] = createDerivedSignal(() => !!result()?.exists.value);

							return (
								<button
									disabled={loading()}
									class="flex items-center gap-3 px-4 py-3 text-left hover:bg-hinted"
									classList={{ 'opacity-50 pointer-events-none': loading() }}
									aria-pressed={checked()}
									onClick={() => setChecked(!checked())}
									// @ts-expect-error
									prop:$data={result()}
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
					<Match when={lists.loading}>
						<div class="flex h-13 items-center justify-center border-divider">
							<CircularProgress />
						</div>
					</Match>

					<Match when={getCollectionCursor(lists(), 'cursor')}>
						{(cursor) => (
							<button
								disabled={mutating()}
								onClick={() => refetch(true, cursor())}
								class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none disabled:opacity-50"
							>
								Show more
							</button>
						)}
					</Match>
				</Switch>
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button disabled={mutating()} onClick={close} class={/* @once */ button({ color: 'ghost' })}>
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
