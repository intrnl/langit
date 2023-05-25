import { For, Show, createMemo } from 'solid-js';
import { type JSX } from 'solid-js/jsx-runtime';

import { type FollowNotificationSlice } from '~/api/models/notifications.ts';
import { type DID } from '~/api/utils.ts';

import { A } from '~/router.ts';

import PersonIcon from '~/icons/baseline-person.tsx';

export interface NotificationFollowProps {
	uid: DID;
	data: FollowNotificationSlice;
}

// How many names to show before considering truncation
const MAX_NAMES = 2;

// How many names to show after truncation
const MAX_NAMES_AFTER_TRUNCATION = 1;

// How many avatars to show
const MAX_AVATARS = 8;

const NotificationFollow = (props: NotificationFollowProps) => {
	const uid = () => props.uid;
	const data = () => props.data;

	const text = createMemo(() => {
		const items = data().items;
		const sliced = items.slice(0, items.length > MAX_NAMES ? MAX_NAMES_AFTER_TRUNCATION : MAX_NAMES);
		const remaining = items.length - sliced.length;

		const nodes: JSX.Element[] = [];

		for (let idx = 0, len = sliced.length; idx < len; idx++) {
			const item = sliced[idx];
			const author = item.author;

			if (len > 1) {
				if (remaining < 1 && idx === len - 1) {
					nodes.push(` and `);
				}
				else if (idx !== 0) {
					nodes.push(`, `);
				}
			}

			nodes.push(
				<A
					href='/u/:uid/profile/:actor'
					params={{ uid: uid(), actor: author.did }}
					class='font-bold hover:underline'
				>
					{author.displayName || `@${author.handle}`}
				</A>,
			);
		}

		if (remaining > 0) {
			nodes.push(` and ${remaining} others`);
		}

		nodes.push(` followed you`);

		return nodes;
	});

	return (
		<div
			class='flex gap-3 px-4 py-3 border-b border-divider'
			classList={{ 'bg-accent/20': !data().read }}
		>
			<div class='shrink-0 flex flex-col gap-3 items-end w-12'>
				<PersonIcon class='text-3xl' />
			</div>
			<div class='grow flex flex-col gap-3 min-w-0'>
				<div class='flex gap-2'>
					<For each={data().items.slice(0, MAX_AVATARS)}>
						{(item) => {
							const author = item.author;

							return (
								<A
									href='/u/:uid/profile/:actor'
									params={{ uid: uid(), actor: author.did }}
									class='h-7.5 w-7.5 rounded-full bg-muted-fg overflow-hidden hover:opacity-80'
								>
									<Show when={author.avatar}>
										{(avatar) => <img src={avatar()} class='h-full w-full' />}
									</Show>
								</A>
							);
						}}
					</For>
				</div>

				<div class='text-sm'>
					{text()}
				</div>
			</div>
		</div>
	);
};

export default NotificationFollow;
