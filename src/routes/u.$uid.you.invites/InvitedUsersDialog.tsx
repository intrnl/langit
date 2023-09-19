import { ErrorBoundary, For, Show, Suspense, SuspenseList } from 'solid-js';

import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getProfileKey, getProfile, getInitialProfile } from '~/api/queries/get-profile.ts';

import { closeModal } from '~/globals/modals.tsx';
import * as relformat from '~/utils/intl/relformatter.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

type Invite = RefOf<'com.atproto.server.defs#inviteCode'>;

export interface InvitedUsersDialogProps {
	uid: DID;
	invite: Invite;
}

const InvitedUsersDialog = (props: InvitedUsersDialogProps) => {
	const uid = () => props.uid;
	const invite = () => props.invite;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>
				Invited users ({invite().uses.length}/{invite().available})
			</h1>

			<div class="-mx-4 mt-3 flex flex-col overflow-y-auto">
				<SuspenseList revealOrder="forwards" tail="collapsed">
					<For
						each={invite().uses}
						fallback={
							<div class="px-4 pb-1">
								<p class="text-sm text-muted-fg">Users you invite with this code will show up here.</p>
							</div>
						}
					>
						{(used) => {
							const [profile] = createQuery({
								key: () => getProfileKey(uid(), used.usedBy),
								fetch: getProfile,
								initialData: getInitialProfile,
								refetchOnReconnect: false,
								refetchOnWindowFocus: false,
								throwOnAccess: true,
							});

							return (
								<Suspense
									fallback={
										<div class="flex h-13 justify-center">
											<CircularProgress />
										</div>
									}
								>
									<div class="flex gap-3 px-4 py-3">
										<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
											<Show when={profile()?.avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<div class="flex min-w-0 grow flex-col gap-1">
											<ErrorBoundary
												fallback={(err) => (
													<div class="text-sm text-muted-fg">
														<p>{'' + err}</p>
														<p>{used.usedBy}</p>
													</div>
												)}
											>
												<div class="flex flex-col text-sm">
													<span class="line-clamp-1 break-all font-bold">
														{profile()?.displayName.value || profile()?.handle.value}
													</span>
													<span class="line-clamp-1 break-all text-muted-fg">@{profile()?.handle.value}</span>
												</div>
											</ErrorBoundary>

											<p class="text-sm text-muted-fg">Invited on {relformat.formatAbs(used.usedAt)}</p>
										</div>
									</div>
								</Suspense>
							);
						}}
					</For>
				</SuspenseList>
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
					Close
				</button>
			</div>
		</div>
	);
};

export default InvitedUsersDialog;
