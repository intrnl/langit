import { Show } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { useNavigate } from '@solidjs/router';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';

import { generatePath } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import FollowButton from '../FollowButton.tsx';

export interface ProfileItemAccessory {
	key: string;
	render: (item: SignalizedProfile, uid: DID) => JSX.Element;
}

export interface ProfileItemProps {
	uid: DID;
	profile: SignalizedProfile;
	aside?: ProfileItemAccessory;
	footer?: ProfileItemAccessory;
}

const ProfileItem = (props: ProfileItemProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;
	const aside = props.aside;
	const footer = props.footer;

	const navigate = useNavigate();

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!isElementClicked(ev, INTERACTION_TAGS)) {
			return;
		}

		const path = generatePath('/u/:uid/profile/:actor', {
			uid: uid(),
			actor: profile().did,
		});

		if (isElementAltClicked(ev)) {
			open(path, '_blank');
		} else {
			navigate(path);
		}
	};

	return (
		<div
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			role="button"
			tabindex={0}
			class="flex gap-3 px-4 py-3 hover:bg-hinted"
		>
			<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
				<Show when={profile().avatar.value}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
			</div>

			<div class="flex min-w-0 grow flex-col gap-1">
				<div class="flex items-center justify-between gap-3">
					<span class="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
						<bdi class="overflow-hidden text-ellipsis group-hover:underline">
							<span class="font-bold text-primary">
								{profile().displayName.value || profile().handle.value}
							</span>
						</bdi>
						<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
							@{profile().handle.value}
						</span>
					</span>

					<div class="empty:hidden">{aside?.render(profile(), uid())}</div>
				</div>

				<Show when={profile().description.value}>
					<div class="line-clamp-3 break-words text-sm">{profile().$renderedDescription()}</div>
				</Show>

				{footer?.render(profile(), uid())}
			</div>
		</div>
	);
};

export default ProfileItem;

export const createProfileItemKey = (
	profile: SignalizedProfile,
	aside?: ProfileItemAccessory,
	footer?: ProfileItemAccessory,
) => {
	return 'profile/' + profile.did + (aside ? '/a:' + aside.key : '') + (footer ? '/f:' + footer.key : '');
};

export const ProfileFollowAccessory: ProfileItemAccessory = {
	key: '',
	render: (profile, uid) => {
		if (profile.did !== uid) {
			return <FollowButton uid={uid} profile={profile} />;
		}

		return null;
	},
};
