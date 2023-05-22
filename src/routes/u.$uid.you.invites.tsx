import { For, Match, Switch, createMemo } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { getInviteCodes, getInviteCodesKey } from '~/api/queries/get-invite-codes.ts';

import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import ContentCopyIcon from '~/icons/baseline-content-copy.tsx';

const AuthenticatedInviteCodesPage = () => {
	const params = useParams('/u/:uid/you/invites');

	const inviteQuery = createQuery({
		queryKey: () => getInviteCodesKey(params.uid),
		queryFn: getInviteCodes,
		staleTime: 5_000,
	});

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='text-base leading-5 font-bold'>Invite codes</p>
			</div>

			<Switch>
				<Match when={inviteQuery.isLoading}>
					<div class='h-13 flex items-center justify-center'>
						<CircularProgress />
					</div>
				</Match>

				<Match when={inviteQuery.data}>
					{(data) => {
						const codes = () => data().codes;

						const availableCount = createMemo(() => {
							const array = codes();
							let count = 0;

							for (let idx = 0, len = array.length; idx < len; idx++) {
								const code = array[idx];

								if (code.available - code.uses.length <= 0 || code.disabled) {
									continue;
								}

								count += 1;
							}

							return count;
						});

						return (
							<div>
								<p class='text-sm p-4 border-b border-divider'>
									You have <span class='font-bold'>{availableCount()}</span> invite codes remaining.
								</p>

								<For each={codes()}>
									{(code) => {
										const used = code.available - code.uses.length <= 0 || code.disabled;

										return (
											<div class='flex items-center gap-4 p-4 border-b border-divider'>
												<div class='text-sm grow'>
													<p class='font-bold' classList={{ 'line-through': used }}>{code.code}</p>

													<Switch
														fallback={<p class='text-muted-fg'>Used {code.uses.length}/{code.available} times</p>}
													>
														<Match when={code.disabled}>
															<p class='text-muted-fg'>Invite code disabled</p>
														</Match>
													</Switch>
												</div>

												<div>
													<button
														onClick={() => navigator.clipboard.writeText(code.code)}
														class='flex items-center justify-center h-9 w-9 -mr-2 rounded-full text-xl hover:bg-secondary'
													>
														<ContentCopyIcon />
													</button>
												</div>
											</div>
										);
									}}
								</For>
							</div>
						);
					}}
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedInviteCodesPage;
