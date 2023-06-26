import { For, Match, Switch, createMemo } from 'solid-js';

import { createQuery } from '~/lib/solid-query/index.ts';

import { type DID } from '~/api/utils.ts';

import { getInviteCodes, getInviteCodesKey } from '~/api/queries/get-invite-codes.ts';

import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import ContentCopyIcon from '~/icons/baseline-content-copy.tsx';

const AuthenticatedInviteCodesPage = () => {
	const params = useParams('/u/:uid/you/invites');

	const uid = () => params.uid as DID;

	const [invites] = createQuery({
		key: () => getInviteCodesKey(uid()),
		fetch: getInviteCodes,
		staleTime: 5_000,
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Invite codes</p>
			</div>

			<Switch>
				<Match when={invites()}>
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
								<p class="border-b border-divider p-4 text-sm">
									You have <span class="font-bold">{availableCount()}</span> invite codes remaining.
								</p>

								<For each={codes()}>
									{(code) => {
										const used = code.available - code.uses.length <= 0 || code.disabled;

										return (
											<div class="flex items-center gap-4 border-b border-divider p-4">
												<div class="grow text-sm">
													<p class="font-bold" classList={{ 'line-through': used }}>
														{code.code}
													</p>

													<Switch
														fallback={
															<p class="text-muted-fg">
																Used {code.uses.length}/{code.available} times
															</p>
														}
													>
														<Match when={code.disabled}>
															<p class="text-muted-fg">Invite code disabled</p>
														</Match>
													</Switch>
												</div>

												<div>
													<button
														onClick={() => navigator.clipboard.writeText(code.code)}
														class="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
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

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedInviteCodesPage;
