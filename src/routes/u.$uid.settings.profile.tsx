import { Match, Show, Switch, createSignal } from 'solid-js';

import type { DID, Records, ResponseOf } from '@intrnl/bluesky-client/atp-schema';
import { createMutation, createQuery } from '@intrnl/sq';

import { uploadBlob } from '~/api/mutations/upload-blob.ts';
import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { useParams } from '~/router.ts';
import { compressProfileImage } from '~/utils/image.ts';
import { createDerivedSignal } from '~/utils/hooks.ts';
import { createId, model } from '~/utils/misc.ts';

import BlobImage from '~/components/BlobImage.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';
import input from '~/styles/primitives/input';
import textarea from '~/styles/primitives/textarea.ts';

import AddPhotoAlternateIcon from '~/icons/baseline-add-photo-alternate.tsx';

import ImageUploadCompressDialog from './u.$uid.compose/ImageUploadCompressDialog.tsx';

const MAX_NAME_LENGTH = 64;
const MAX_BIO_LENGTH = 256;

type ProfileRecord = Records['app.bsky.actor.profile'];

interface AddPhotoButtonProps {
	title: string;
	aspectRatio: number;
	maxWidth: number;
	maxHeight: number;
	onPick: (blob: Blob) => void;
}

const AddPhotoButton = (props: AddPhotoButtonProps) => {
	let input: HTMLInputElement | undefined;

	const [loading, setLoading] = createSignal(false);

	const processBlob = async (file: File) => {
		if (loading()) {
			return;
		}

		setLoading(true);

		try {
			const { aspectRatio, maxWidth, maxHeight } = props;
			const result = await compressProfileImage(file, aspectRatio, maxWidth, maxHeight);

			if (result.before !== result.after) {
				openModal(() => (
					<ImageUploadCompressDialog
						images={[{ ...result, name: file.name }]}
						onSubmit={() => props.onPick(result.blob)}
					/>
				));
			} else {
				props.onPick(file);
			}
		} catch {}

		setLoading(false);
	};

	const handleClick = () => {
		input!.click();
	};

	const handleFileInput = (ev: Event & { currentTarget: HTMLInputElement }) => {
		const target = ev.currentTarget;
		const files = Array.from(target.files!);

		target.value = '';

		if (files.length > 0) {
			processBlob(files[0]);
		}
	};

	return (
		<>
			<Show
				when={!loading()}
				fallback={
					<div class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/75">
						<CircularProgress />
					</div>
				}
			>
				<button
					title={props.title}
					onClick={handleClick}
					class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 outline-2 outline-primary hover:bg-secondary focus-visible:outline"
				>
					<AddPhotoAlternateIcon class="text-xl" />
				</button>
			</Show>

			<input ref={input} type="file" class="hidden" accept="image/*" onChange={handleFileInput} />
		</>
	);
};

const AuthenticatedProfileSettingsPage = () => {
	const params = useParams('/u/:uid/settings/profile');
	const id = createId();

	const uid = () => params.uid as DID;

	const [profile, { refetch }] = createQuery({
		key: () => getProfileKey(uid(), uid()),
		fetch: getProfile,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const [name, setName] = createDerivedSignal(() => profile()?.displayName.value || '');
	const [bio, setBio] = createDerivedSignal(() => profile()?.description.value || '');
	const [avatar, setAvatar] = createDerivedSignal<Blob | string | undefined>(() => profile()?.avatar.value);
	const [banner, setBanner] = createDerivedSignal<Blob | string | undefined>(() => profile()?.banner.value);

	const mutation = createMutation({
		mutate: async () => {
			const $uid = uid();
			const agent = await multiagent.connect($uid);

			let rec: ProfileRecord | undefined;
			let resp: ResponseOf<'com.atproto.repo.getRecord'> | undefined;

			try {
				const existing = await agent.rpc.get('com.atproto.repo.getRecord', {
					params: {
						collection: 'app.bsky.actor.profile',
						repo: $uid,
						rkey: 'self',
					},
				});

				resp = existing.data;
				rec = resp.value as any;
			} catch {}

			const $avatar = avatar();
			const $banner = banner();

			const record: ProfileRecord = {
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

			await agent.rpc.call('com.atproto.repo.putRecord', {
				data: {
					collection: 'app.bsky.actor.profile',
					repo: $uid,
					rkey: 'self',
					swapRecord: resp?.cid,
					record: record,
				},
			});
		},
		onSuccess: () => refetch(true),
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-20 flex h-13 items-center gap-4 border-b border-divider bg-background px-4">
				<div class="flex grow flex-col gap-0.5">
					<p class="text-base font-bold leading-5">Edit profile</p>

					<Show when={profile()}>
						{(profile) => <p class="text-xs text-muted-fg">@{profile().handle.value}</p>}
					</Show>
				</div>

				<Show when={profile()}>
					<button
						onClick={() => mutation.mutate(null)}
						disabled={mutation.isLoading}
						class={/* @once */ button({ color: 'primary', size: 'xs' })}
					>
						Save
					</button>
				</Show>
			</div>

			<Switch>
				<Match when={profile()}>
					{(_profile) => (
						<fieldset disabled={mutation.isLoading} class="contents">
							<div class="relative aspect-banner bg-muted-fg">
								<Show when={banner()} keyed>
									{(banner) => <BlobImage src={banner} class="h-full w-full" />}
								</Show>

								<AddPhotoButton
									title="Add banner image"
									aspectRatio={3 / 1}
									maxWidth={3000}
									maxHeight={1000}
									onPick={setBanner}
								/>
							</div>

							<div class="z-10 flex flex-col gap-4 p-4">
								<div class="relative -mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg outline-2 outline-background outline">
									<Show when={avatar()} keyed>
										{(avatar) => <BlobImage src={avatar} class="h-full w-full" />}
									</Show>

									<AddPhotoButton
										title="Add profile image"
										aspectRatio={1 / 1}
										maxWidth={1000}
										maxHeight={1000}
										onPick={setAvatar}
									/>
								</div>

								<div class="flex flex-col gap-2">
									<label for={'name' + id} class="block text-sm font-medium leading-6 text-primary">
										Display name
									</label>
									<input
										ref={model(name, setName)}
										type="text"
										id={'name' + id}
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
										rows={5}
										maxLength={MAX_BIO_LENGTH}
										class={/* @once */ textarea()}
									/>
									<span class="self-end text-xs text-muted-fg">
										{bio().length} / {MAX_BIO_LENGTH}
									</span>
								</div>
							</div>
						</fieldset>
					)}
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

export default AuthenticatedProfileSettingsPage;
