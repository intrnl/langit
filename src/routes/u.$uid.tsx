import { ErrorBoundary, Show, createEffect } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';
import { createQuery } from '@intrnl/sq';
import { Navigate, Outlet, useLocation } from '@solidjs/router';

import { MultiagentError } from '~/api/multiagent.ts';

import { getNotificationsLatest, getNotificationsLatestKey } from '~/api/queries/get-notifications.ts';
import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { A, useParams } from '~/router.ts';
import { parseStackTrace } from '~/utils/errorstacks.ts';
import { useMediaQuery } from '~/utils/media-query.ts';

import InvalidSessionNoticeDialog from '~/components/dialogs/InvalidSessionNoticeDialog.tsx';
import button from '~/styles/primitives/button.ts';

import AddBoxIcon from '~/icons/baseline-add-box.tsx';
import ExploreIcon from '~/icons/baseline-explore.tsx';
import HomeIcon from '~/icons/baseline-home.tsx';
import NotificationsIcon from '~/icons/baseline-notifications.tsx';
import AddBoxOutlinedIcon from '~/icons/outline-add-box.tsx';
import ExploreOutlinedIcon from '~/icons/outline-explore.tsx';
import HomeOutlinedIcon from '~/icons/outline-home.tsx';
import NotificationsOutlinedIcon from '~/icons/outline-notifications.tsx';

const handleError = (error: any, reset: () => void) => {
	const parseFileName = (file: string) => {
		try {
			const url = new URL(file);

			if (url.host === location.host) {
				return url.pathname + url.search;
			}
		} catch {}

		return file;
	};

	const renderError = (error: any) => {
		if (error instanceof Error) {
			const frames = parseStackTrace(error.stack);

			const renderedFrames = frames
				.map(({ fileName: file, name, line, column }) => {
					return `  at ${parseFileName(file)} @ ${name || '<unknown>'} (${line}:${column})`;
				})
				.join('\n');

			return `${error.name}: ${error.message}\n${renderedFrames}`;
		}

		return '' + error + '\nThis thrown value is not of an Error object!';
	};

	return (
		<div class="p-4">
			<h1 class="mb-4 font-bold">Something went wrong</h1>

			<pre class="overflow-x-auto text-sm">{renderError(error)}</pre>

			<div class="mt-4 flex gap-4">
				<button onClick={reset} class={/* @once */ button({ color: 'primary' })}>
					Try again
				</button>
				<button onClick={() => location.reload()} class={/* @once */ button({ color: 'outline' })}>
					Reload page
				</button>
			</div>
		</div>
	);
};

const AuthenticatedLayout = () => {
	const location = useLocation();
	const params = useParams('/u/:uid');

	const uid = () => params.uid as DID;

	if (!multiagent.accounts || !multiagent.accounts[uid()]) {
		const path = location.pathname.slice(4 + params.uid.length);
		return <Navigate href={`/login?to=${encodeURIComponent('@uid/' + path)}`} />;
	}

	const isDesktop = useMediaQuery('(width >= 640px)');

	const [profile] = createQuery({
		key: () => getProfileKey(uid(), uid()),
		fetch: getProfile,
		staleTime: 60_000,
		refetchOnMount: true,
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
	});

	const [latestNotification] = createQuery({
		key: () => getNotificationsLatestKey(uid()),
		fetch: getNotificationsLatest,
		staleTime: 10_000,
	});

	createEffect(() => {
		let error = profile.error;
		let invalid = false;

		if (error) {
			if (error instanceof MultiagentError) {
				error = error.cause || error;
			}

			if (error instanceof XRPCError) {
				invalid = error.error === 'InvalidToken' || error.error === 'ExpiredToken';
			} else if (error instanceof Error) {
				invalid = error.message === 'INVALID_TOKEN';
			}

			if (invalid) {
				openModal(() => <InvalidSessionNoticeDialog uid={/* @once */ uid()} />, {
					disableBackdropClose: true,
				});
			}
		}
	});

	return (
		<div class="mx-auto flex min-h-screen max-w-7xl flex-col sm:flex-row sm:justify-center">
			<Show when={isDesktop()}>
				<div class="sticky top-0 flex h-screen flex-col items-end xl:basis-1/4">
					<div class="flex grow flex-col gap-2 p-2 lg:p-4 xl:w-64">
						<A
							href="/u/:uid"
							params={{ uid: params.uid }}
							title="Home"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
							end
						>
							<div class="p-2">
								<HomeOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<HomeIcon class="hidden text-2xl group-[.is-active]:block" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Home</span>
						</A>

						<A
							href="/u/:uid/explore"
							params={{ uid: params.uid }}
							title="Search"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<ExploreOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<ExploreIcon class="hidden text-2xl group-[.is-active]:block" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Explore</span>
						</A>

						<A
							href="/u/:uid/notifications"
							params={{ uid: params.uid }}
							title="Notifications"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="relative p-2">
								<NotificationsOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<NotificationsIcon class="hidden text-2xl group-[.is-active]:block" />

								<Show when={latestNotification() && !latestNotification()!.read}>
									<div class="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
								</Show>
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Notifications</span>
						</A>

						<div class="grow" />

						<A
							href="/u/:uid/compose"
							params={{ uid: params.uid }}
							title="Compose"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<AddBoxOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<AddBoxIcon class="hidden text-2xl group-[.is-active]:block" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Compose</span>
						</A>

						<A
							href="/u/:uid/you"
							params={{ uid: params.uid }}
							title="You"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<div class="h-6 w-6 overflow-hidden rounded-full bg-muted-fg ring-primary group-[.is-active]:ring-2">
									<Show when={!profile.error && profile()?.avatar.value}>
										{(avatar) => <img src={avatar()} class="h-full w-full object-cover" />}
									</Show>
								</div>
							</div>

							<span class="hidden overflow-hidden text-ellipsis text-base group-[.is-active]:font-medium xl:inline">
								<Show when={!profile.error && profile()} fallback="You">
									{(profile) => <>{profile().displayName.value || '@' + profile().handle.value}</>}
								</Show>
							</span>
						</A>
					</div>
				</div>
			</Show>

			<div class="flex min-w-0 max-w-2xl shrink grow flex-col border-divider sm:border-x xl:max-w-none xl:basis-2/4">
				<ErrorBoundary fallback={handleError}>
					<Outlet />
				</ErrorBoundary>
			</div>

			<div class="hidden basis-1/4 xl:block"></div>

			<Show when={!isDesktop()}>
				<div class="sticky bottom-0 z-30 flex h-13 border-t border-divider bg-background text-primary">
					<A
						href="/u/:uid"
						params={{ uid: params.uid }}
						title="Home"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
						end
					>
						<HomeOutlinedIcon class="group-[.is-active]:hidden" />
						<HomeIcon class="hidden group-[.is-active]:block" />
					</A>
					<A
						href="/u/:uid/explore"
						params={{ uid: params.uid }}
						title="Explore"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<ExploreOutlinedIcon class="group-[.is-active]:hidden" />
						<ExploreIcon class="hidden group-[.is-active]:block" />
					</A>
					<A
						href="/u/:uid/compose"
						params={{ uid: params.uid }}
						title="Compose"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<AddBoxOutlinedIcon class="group-[.is-active]:hidden" />
						<AddBoxIcon class="hidden group-[.is-active]:block" />
					</A>
					<A
						href="/u/:uid/notifications"
						params={{ uid: params.uid }}
						title="Notifications"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<div class="relative">
							<NotificationsOutlinedIcon class="group-[.is-active]:hidden" />
							<NotificationsIcon class="hidden group-[.is-active]:block" />

							<Show when={latestNotification() && !latestNotification()!.read}>
								<div class="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
							</Show>
						</div>
					</A>
					<A
						href="/u/:uid/you"
						params={{ uid: params.uid }}
						title="You"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<div class="h-6 w-6 overflow-hidden rounded-full bg-muted-fg ring-primary group-[.is-active]:ring-2">
							<Show when={!profile.error && profile()?.avatar.value}>
								{(avatar) => <img src={avatar()} class="h-full w-full object-cover" />}
							</Show>
						</div>
					</A>
				</div>
			</Show>
		</div>
	);
};

export default AuthenticatedLayout;
