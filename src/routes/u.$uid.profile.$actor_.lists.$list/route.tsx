import { Match, Show, Switch, createMemo } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { Outlet } from '@solidjs/router';

import { createListUri, getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list.ts';
import { getProfileDid, getProfileDidKey } from '~/api/queries/get-profile-did.ts';

import { ListPurposeLabels } from '~/api/display.ts';

import { openModal } from '~/globals/modals.tsx';
import { getFeedPref } from '~/globals/settings.ts';
import { generatePath, useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import { TabLink } from '~/components/Tab.tsx';
import button from '~/styles/primitives/button.ts';

import EditIcon from '~/icons/baseline-edit.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

import { ListDidContext } from './context.tsx';
import ListMenu from './ListMenu.tsx';
import SubscribeListDialog from './SubscribeListDialog.tsx';

const enum Subscription {
	MUTED = 1,
	BLOCKED,
}

const AuthenticatedListLayout = () => {
	const params = useParams('/u/:uid/profile/:actor/lists/:list');

	const uid = () => params.uid as DID;

	const [did, actions] = createQuery({
		key: () => getProfileDidKey(uid(), params.actor),
		fetch: getProfileDid,
		staleTime: 60_000,
	});

	const [list] = createQuery({
		key: () => {
			const $did = did();
			if ($did) {
				return getListInfoKey(uid(), createListUri($did, params.list));
			}
		},
		fetch: getListInfo,
		initialData: getInitialListInfo,
		staleTime: 60_000,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const subscription = createMemo(() => {
		const $list = list();

		if ($list) {
			const $viewer = $list.viewer;

			if ($viewer.blocked.value) {
				return Subscription.BLOCKED;
			} else if ($viewer.muted.value) {
				return Subscription.MUTED;
			}
		}

		return undefined;
	});

	const purposeLabel = () => {
		const raw = list()?.purpose.value;
		return raw && raw in ListPurposeLabels ? ListPurposeLabels[raw] : `Unknown list`;
	};

	return (
		<div class="flex grow flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<Switch>
					<Match when={list()}>
						{(info) => (
							<>
								<Title render={() => `List (${info().name.value}) / Langit`} />
								<p class="text-base font-bold">{info().name.value}</p>
							</>
						)}
					</Match>

					<Match when>
						<Title render={() => `List (${params.list}) / Langit`} />
						<p class="text-base font-bold">List</p>
					</Match>
				</Switch>
			</div>

			<Show when={list()} keyed>
				{(list) => {
					const creator = list.creator;

					const isModerationList = () => list.purpose.value === 'app.bsky.graph.defs#modlist';
					const isCurationList = () => list.purpose.value === 'app.bsky.graph.defs#curatelist';

					return (
						<div class="border-b border-divider">
							<div class="flex flex-col gap-3 px-4 pb-4 pt-3">
								<div class="flex gap-4">
									<div class="mt-2 grow">
										<p class="break-words text-lg font-bold">{list.name.value}</p>
										<p class="text-sm text-muted-fg">
											<span>{purposeLabel()} by </span>
											<a
												link
												href={generatePath('/u/:uid/profile/:actor', { uid: uid(), actor: creator.did })}
												class="hover:underline"
											>
												@{creator.handle.value}
											</a>
										</p>
									</div>

									<div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted-fg">
										<Show when={list.avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>
								</div>

								<Show when={list.description.value}>
									<div class="whitespace-pre-wrap break-words text-sm">{list.$renderedDescription()}</div>
								</Show>

								<div class="flex gap-2">
									<Switch>
										<Match when={isModerationList()}>
											<button
												onClick={() => {
													openModal(() => <SubscribeListDialog uid={uid()} list={list} />);
												}}
												class={button({ color: subscription() ? 'outline' : 'primary' })}
											>
												{subscription() ? 'Unsubscribe list' : 'Subscribe list'}
											</button>
										</Match>
										<Match when={isCurationList()}>
											{(_value) => {
												const isSaved = createMemo(() => {
													const feeds = getFeedPref(uid()).feeds;

													for (let idx = 0, len = feeds.length; idx < len; idx++) {
														const item = feeds[idx];

														if (item.uri === list.uri) {
															return { index: idx, item: item };
														}
													}
												});

												const toggleSave = () => {
													const feeds = getFeedPref(uid()).feeds;
													const saved = isSaved();

													if (saved) {
														feeds.splice(saved.index, 1);
													} else {
														feeds.push({ uri: list.uri, name: list.name.value, pinned: false });
													}
												};

												return (
													<button
														onClick={toggleSave}
														class={button({ color: isSaved() ? 'outline' : 'primary' })}
													>
														{isSaved() ? 'Unfollow list' : 'Follow list'}
													</button>
												);
											}}
										</Match>
									</Switch>

									<div class="grow" />

									<Show when={creator.did === uid()}>
										<a
											link
											href={generatePath('/u/:uid/profile/:actor/lists/:list/edit', params)}
											title="Edit list"
											class={/* @once */ button({ color: 'outline' })}
										>
											<EditIcon class="-mx-1.5 text-base" />
										</a>
									</Show>

									<button
										title="More actions"
										onClick={() => openModal(() => <ListMenu uid={uid()} list={list} />)}
										class={/* @once */ button({ color: 'outline' })}
									>
										<MoreHorizIcon class="-mx-1.5 text-base" />
									</button>
								</div>
							</div>

							<Show when={isCurationList()}>
								<div class="flex h-13 overflow-x-auto">
									<TabLink href={generatePath('/u/:uid/profile/:actor/lists/:list', params)} replace end>
										Members
									</TabLink>
									<TabLink href={generatePath('/u/:uid/profile/:actor/lists/:list/feed', params)} replace>
										Feed
									</TabLink>
								</div>
							</Show>
						</div>
					);
				}}
			</Show>

			<ListDidContext.Provider value={/* @once */ [did, actions]}>
				<Outlet />
			</ListDidContext.Provider>
		</div>
	);
};

export default AuthenticatedListLayout;
