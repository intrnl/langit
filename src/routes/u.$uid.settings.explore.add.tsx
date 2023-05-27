import { For, Match, Show, Switch } from 'solid-js';

import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { type DID, getRecordId, getRepoId } from '~/api/utils.ts';

import { getPopularFeedGenerators, getPopularFeedGeneratorsKey } from '~/api/queries/get-feed-generator.ts';

import { useParams } from '~/router.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import AddIcon from '~/icons/baseline-add.tsx';
import VirtualContainer from '~/components/VirtualContainer';

const AuthenticatedAddCustomFeedPage = () => {
	const params = useParams('/u/:uid/settings/explore/add');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const feedQuery = createQuery({
		queryKey: () => getPopularFeedGeneratorsKey(uid()),
		queryFn: getPopularFeedGenerators,
		staleTime: 120_000,
	});

	return (
		<div class="flex flex-col pb-4">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Discover custom feeds</p>
			</div>

			<Switch>
				<Match when={feedQuery.isLoading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={feedQuery.data}>
					{(list) => (
						<For each={list()}>
							{(feed) => {
								const click = (ev: MouseEvent | KeyboardEvent) => {
									if (!isElementClicked(ev)) {
										return;
									}

									const uri = feed.uri;
									const path = `/u/${uid()}/profile/${getRepoId(uri)}/feed/${getRecordId(uri)}`;

									if (isElementAltClicked(ev)) {
										open(path, '_blank');
									} else {
										navigate(path);
									}
								};

								return (
									<VirtualContainer key="feed" id={feed.cid}>
										<div
											tabindex={0}
											onClick={click}
											onAuxClick={click}
											onKeyDown={click}
											class="flex flex-col gap-3 border-b border-divider px-4 py-3 text-sm hover:bg-hinted"
										>
											<div class="flex items-center gap-4">
												<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
													<Show when={feed.avatar.value}>
														{(avatar) => <img src={avatar()} class="h-full w-full" />}
													</Show>
												</div>

												<div class="grow">
													<p class="font-bold">{feed.displayName.value}</p>
													<p class="text-muted-fg">by @{feed.creator.handle.value}</p>
												</div>

												<div class="shrink-0">
													<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-secondary">
														<AddIcon />
													</button>
												</div>
											</div>

											<Show when={feed.description.value}>
												<div class="whitespace-pre-wrap break-words text-sm">
													{feed.$renderedDescription(uid())}
												</div>
											</Show>

											<p class="text-muted-fg">Liked by {feed.likeCount.value} users</p>
										</div>
									</VirtualContainer>
								);
							}}
						</For>
					)}
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedAddCustomFeedPage;
