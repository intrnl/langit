import { Match, Show, Switch } from 'solid-js';

import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query';

import { type BskyProfileRecord, type BskyRecord } from '~/api/types';
import { type DID } from '~/api/utils.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { useParams } from '~/router.ts';
import { multiagent } from '~/globals/agent.ts';
import { createDerivedSignal } from '~/utils/hooks.ts';
import { createId, model } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';
import input from '~/styles/primitives/input';
import { uploadBlob } from '~/api/mutations/upload-blob';

const MAX_NAME_LENGTH = 64;
const MAX_BIO_LENGTH = 256;

const AuthenticatedProfileSettingsPage = () => {
	const params = useParams('/u/:uid/settings/profile');
	const id = createId();

	const uid = () => params.uid as DID;

	const client = useQueryClient();

	const query = createQuery({
		queryKey: () => getProfileKey(uid(), uid()),
		queryFn: getProfile,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const [name, setName] = createDerivedSignal(() => query.data?.displayName.value || '');
	const [bio, setBio] = createDerivedSignal(() => query.data?.description.value || '');
	const [avatar, setAvatar] = createDerivedSignal<Blob | string | undefined>(() => query.data?.avatar.value);
	const [banner, setBanner] = createDerivedSignal<Blob | string | undefined>(() => query.data?.banner.value);

	const mutation = createMutation({
		mutationFn: async () => {
			const $uid = uid();
			const agent = await multiagent.connect($uid);

			const existing = await agent.rpc.get<BskyRecord<BskyProfileRecord>>({
				method: 'com.atproto.repo.getRecord',
				params: {
					collection: 'app.bsky.actor.profile',
					repo: $uid,
					rkey: 'self',
				},
			});

			const rec = existing.data.value;

			const $avatar = avatar();
			const $banner = banner();

			const record: BskyProfileRecord = {
				$type: 'app.bsky.actor.profile',
				displayName: name(),
				description: bio(),
				avatar:
					$avatar === undefined
						? undefined
						: $avatar instanceof Blob
						? (($avatar as any).$blob ||= await uploadBlob($uid, $avatar))
						: rec?.avatar,
				banner:
					$banner === undefined
						? undefined
						: $banner instanceof Blob
						? (($banner as any).$blob ||= await uploadBlob($uid, $banner))
						: rec?.banner,
			};

			await agent.rpc.post({
				method: 'com.atproto.repo.putRecord',
				data: {
					collection: 'app.bsky.actor.profile',
					repo: $uid,
					rkey: 'self',
					swapRecord: existing?.data.cid || null,
					record: record,
				},
			});
		},
		onSuccess: () => {
			return client.invalidateQueries(getProfileKey(uid(), uid()));
		},
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-20 flex h-13 items-center gap-4 border-b border-divider bg-background px-4">
				<div class="flex grow flex-col gap-0.5">
					<p class="text-base font-bold leading-5">Edit profile</p>

					<Show when={query.data}>
						{(profile) => <p class="text-xs text-muted-fg">@{profile().handle.value}</p>}
					</Show>
				</div>

				<Show when={query.data}>
					<button
						onClick={() => mutation.mutate()}
						disabled={mutation.isLoading}
						class={/* @once */ button({ color: 'primary', size: 'xs' })}
					>
						Save
					</button>
				</Show>
			</div>

			<Switch>
				<Match when={query.isLoading}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={query.data}>
					{(profile) => (
						<fieldset disabled={mutation.isLoading} class="contents">
							<div class="aspect-banner bg-muted-fg">
								<Show when={profile().banner.value}>
									{(banner) => <img src={banner()} class="h-full w-full" />}
								</Show>
							</div>

							<div class="flex flex-col gap-4 p-4">
								<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg ring-2 ring-background">
									<Show when={profile().avatar.value}>
										{(avatar) => <img src={avatar()} class="h-full w-full" />}
									</Show>
								</div>

								<div class="flex flex-col gap-2">
									<label for={'name' + id} class="block text-sm font-medium leading-6 text-primary">
										Display name
									</label>
									<input
										ref={model(name, setName)}
										type="text"
										id={'name' + id}
										value={profile().displayName.value}
										maxLength={MAX_NAME_LENGTH}
										class={/* @once */ input()}
									/>
								</div>

								<div class="flex flex-col gap-2">
									<label for={'bio' + id} class="block text-sm font-medium leading-6 text-primary">
										Bio
									</label>
									<textarea
										ref={model(bio, setBio)}
										id={'bio' + id}
										value={profile().description.value}
										rows={5}
										maxLength={MAX_BIO_LENGTH}
										class="block w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
									/>
									<span class="self-end text-xs text-muted-fg">
										{bio().length} / {MAX_BIO_LENGTH}
									</span>
								</div>
							</div>
						</fieldset>
					)}
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedProfileSettingsPage;
