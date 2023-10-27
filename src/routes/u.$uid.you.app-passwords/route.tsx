import { For, Match, Switch, createSignal } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getAppPasswords, getAppPasswordsKey } from '~/api/queries/get-app-passwords.ts';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';
import * as relformat from '~/utils/intl/relformatter.ts';

import ConfirmDialog from '~/components/dialogs/ConfirmDialog.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';

import DeleteIcon from '~/icons/baseline-delete.tsx';
import AddIcon from '~/icons/baseline-add.tsx';

import AddAppPasswordDialog from './AddAppPasswordDialog.tsx';

const AuthenticatedAppPasswordsPage = () => {
	const params = useParams('/u/:uid/you/app-passwords');

	const uid = () => params.uid as DID;

	const [passwords, { refetch }] = createQuery({
		key: () => getAppPasswordsKey(uid()),
		fetch: getAppPasswords,
		staleTime: 30_000,
	});

	return (
		<div>
			<Title render={`App passwords / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">App passwords</p>

				<div class="grow"></div>

				<button
					disabled={!passwords()}
					title="Add new app password"
					onClick={() => {
						openModal(() => (
							<AddAppPasswordDialog
								uid={uid()}
								passwords={passwords()!.passwords}
								onAdd={() => refetch(true)}
							/>
						));
					}}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
				>
					<AddIcon />
				</button>
			</div>

			<For each={passwords()?.passwords}>
				{(pass) => {
					const [revoked, setRevoked] = createSignal(false);

					const revoke = async () => {
						setRevoked(true);

						const agent = await multiagent.connect(uid());

						await agent.rpc.call('com.atproto.server.revokeAppPassword', {
							data: {
								name: pass.name,
							},
						});

						refetch(true);
					};

					return (
						<div class="flex items-center gap-4 border-b border-divider p-4">
							<div class="grow text-sm">
								<p class="font-bold">{pass.name}</p>
								<p class="text-muted-fg">{relformat.formatAbs(pass.createdAt)}</p>
							</div>

							<div class="-mr-2">
								<button
									disabled={revoked()}
									title="Revoke this app password"
									onClick={() => {
										openModal(() => (
											<ConfirmDialog
												title="Revoke this password?"
												body={
													<>
														Are you sure you want to revoke <strong>{pass.name}</strong>?
													</>
												}
												confirmation="Revoke"
												onConfirm={revoke}
											/>
										));
									}}
									class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
								>
									<DeleteIcon />
								</button>
							</div>
						</div>
					);
				}}
			</For>

			<Switch>
				<Match when={passwords.loading}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match
					when={(() => {
						const $data = passwords();
						return $data && $data.passwords.length < 1;
					})()}
				>
					<p class="p-4 text-sm text-muted-fg">You don't have any app passwords set up.</p>
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedAppPasswordsPage;
