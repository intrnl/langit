import { For, Match, Switch, createSignal } from 'solid-js';

import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';

import { type NotificationsPage } from '~/api/models/notifications.ts';
import { type DID } from '~/api/utils.ts';

import { updateNotificationsSeen } from '~/api/mutations/update-notifications-seen.ts';
import {
	createNotificationsQuery,
	getNotificationsKey,
	getNotificationsLatest,
	getNotificationsLatestKey,
} from '~/api/queries/get-notifications.ts';

import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Notification from '~/components/Notification.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

const PAGE_SIZE = 30;

const AuthenticatedNotificationsPage = () => {
	const params = useParams('/u/:uid/notifications');

	const uid = () => params.uid as DID;

	const [dispatching, setDispatching] = createSignal(false);

	const client = useQueryClient();

	const notificationsQuery = createInfiniteQuery({
		queryKey: () => getNotificationsKey(uid()),
		queryFn: createNotificationsQuery(PAGE_SIZE),
		getNextPageParam: (page) => page.length >= PAGE_SIZE && page.cursor,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		onSuccess: (data) => {
			const pages = data.pages;
			const length = pages.length;

			// if the page size is 1, that means we've just went through an initial
			// fetch, or a refetch, since our refetch process involves truncating the
			// timeline first.
			if (length === 1) {
				const page = pages[0];

				client.setQueryData(getNotificationsLatestKey(uid()), {
					cid: page.cid,
					read: page.slices[0]?.read ?? true,
				});
			}

			// check if the last page is empty because of its slices being filtered
			// away, if so, fetch next page
			if (length > 0) {
				const last = pages[length - 1];

				if (last.cid && last.slices.length === 0) {
					notificationsQuery.fetchNextPage();
				}
			}
		},
	});

	const latestQuery = createQuery({
		queryKey: () => getNotificationsLatestKey(uid()),
		queryFn: getNotificationsLatest,
		staleTime: 10_000,
		get enabled() {
			const data = notificationsQuery.data;

			if (!data || data.pages.length < 1 || !data.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	const getLatestCid = () => {
		return notificationsQuery.data?.pages[0].cid;
	};

	const onRefetch = () => {
		// we want to truncate the notifications here so that the refetch doesn't
		// also refetching however many pages of notifications that the user has
		// gone through.

		// this is the only way we can do that in tanstack query

		// ideally it would've been `{ pages: [], pageParams: [undefined] }`,
		// but unfortunately that breaks the `hasNextPage` check down below
		// and would also mean the user gets to see nothing for a bit.
		client.setQueryData(getNotificationsKey(uid()), (prev?: InfiniteData<NotificationsPage>) => {
			if (prev) {
				return {
					pages: prev.pages.slice(0, 1),
					pageParams: prev.pageParams.slice(0, 1),
				};
			}

			return;
		});

		notificationsQuery.refetch();
	};

	const onMarkAsRead = async () => {
		// Only mark read up to the last notifications we've seen, it's possible that
		// new notifications might have arrived and we haven't refreshed yet.
		const date = notificationsQuery.data?.pages[0]?.date;

		if (dispatching() || !date) {
			return;
		}

		setDispatching(true);

		try {
			await updateNotificationsSeen(uid(), new Date(date));

			onRefetch();
		} finally {
			setDispatching(false);
		}
	};

	return (
		<div class="flex grow flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center justify-between gap-4 border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Notifications</p>

				<button
					disabled={dispatching() || notificationsQuery.isInitialLoading || notificationsQuery.isRefetching}
					onClick={onMarkAsRead}
					class={/* @once */ button({ color: 'outline' })}
				>
					Mark as read
				</button>
			</div>

			<Switch>
				<Match when={notificationsQuery.isInitialLoading || notificationsQuery.isRefetching}>
					<div
						class="flex h-13 items-center justify-center border-divider"
						classList={{ 'border-b': notificationsQuery.isRefetching }}
					>
						<CircularProgress />
					</div>
				</Match>

				<Match when={latestQuery.data && latestQuery.data.cid !== getLatestCid()}>
					<button
						onClick={onRefetch}
						class="flex h-13 items-center justify-center border-b border-divider text-sm text-accent hover:bg-hinted"
					>
						Show new notifications
					</button>
				</Match>
			</Switch>

			<div>
				<For each={notificationsQuery.data ? notificationsQuery.data.pages : []}>
					{(page) =>
						page.slices.map((slice) => {
							return (
								<VirtualContainer key="notifs" id={/* @once */ '' + slice.date}>
									<Notification uid={uid()} data={slice} />
								</VirtualContainer>
							);
						})
					}
				</For>
			</div>

			<Switch>
				<Match when={notificationsQuery.isFetchingNextPage}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={notificationsQuery.hasNextPage}>
					<button
						onClick={() => notificationsQuery.fetchNextPage()}
						disabled={notificationsQuery.isRefetching}
						class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
						Show more notifications
					</button>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedNotificationsPage;
