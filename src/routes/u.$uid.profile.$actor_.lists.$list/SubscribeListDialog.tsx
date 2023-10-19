import { Match, Switch, createMemo, createSignal } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { SignalizedList } from '~/api/cache/lists.ts';
import { subscribeBlockList } from '~/api/mutations/subscribe-block-list.ts';
import { subscribeMuteList } from '~/api/mutations/subscribe-mute-list.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import * as menu from '~/styles/primitives/menu.ts';

import CheckIcon from '~/icons/baseline-check.tsx';

export interface SubscribeListDialogProps {
	uid: DID;
	list: SignalizedList;
}

const enum Subscription {
	MUTED = 1,
	BLOCKED,
}

interface SubscriptionOption {
	value: Subscription;
	name: string;
	desc: string;
}

const options: SubscriptionOption[] = [
	{
		value: Subscription.MUTED,
		name: `Mute everyone in this list`,
		desc: `Their interactions will no longer show up in your timeline and notifications, but it will still allow them to see your posts and interact with you.`,
	},
	{
		value: Subscription.BLOCKED,
		name: `Block everyone in this list`,
		desc: `They will not be able to see your posts or otherwise interact with you, and you will not see posts and replies from them.`,
	},
];

const SubscribeListDialog = (props: SubscribeListDialogProps) => {
	const list = () => props.list;

	const subscription = createMemo(() => {
		const $viewer = list().viewer;

		if ($viewer.blocked.value) {
			return Subscription.BLOCKED;
		} else if ($viewer.muted.value) {
			return Subscription.MUTED;
		}

		return undefined;
	});

	const act = (next: Subscription) => {
		const $did = props.uid;
		const $list = list();

		if (next === Subscription.BLOCKED) {
			subscribeBlockList($did, $list);
		} else if (next === Subscription.MUTED) {
			subscribeMuteList($did, $list);
		}
	};

	return (
		<Switch>
			<Match when={subscription()}>
				{(subscription) => (
					<div class={/* @once */ dialog.content()}>
						<h1 class={/* @once */ dialog.title()}>Unsubscribe from this list?</h1>

						{subscription() === Subscription.BLOCKED ? (
							<p class="mt-3 text-sm">
								You're currently blocking the users in this list, by unsubscribing from{' '}
								<strong>{list().name.value}</strong>, they will be allowed to view your posts and interact
								with you.
							</p>
						) : (
							<p class="mt-3 text-sm">
								You're currently muting the users in this list, by unsubscribing from{' '}
								<strong>{list().name.value}</strong>, their interactions will be allowed to show in your
								timeline and notifications.
							</p>
						)}

						<div class={/* @once */ dialog.actions()}>
							<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
								Cancel
							</button>
							<button
								onClick={() => {
									const $subscription = subscription();

									closeModal();
									act($subscription);
								}}
								class={/* @once */ button({ color: 'primary' })}
							>
								Unsubscribe
							</button>
						</div>
					</div>
				)}
			</Match>
			<Match when>
				{(_true) => {
					const [chosen, setChosen] = createSignal<SubscriptionOption>();

					const renderOptions = () => {
						const nodes: JSX.Element = [];

						for (const option of options) {
							nodes.push(
								<button
									onClick={() => setChosen(option)}
									class={/* @once */ menu.item()}
									classList={{ 'group is-active': chosen() === option }}
								>
									<div class="grow">
										<p>{option.name}</p>
										<p class="text-muted-fg">{option.desc}</p>
									</div>
									<CheckIcon class="invisible shrink-0 text-xl text-accent group-[.is-active]:visible" />
								</button>,
							);
						}

						return nodes;
					};

					return (
						<div class={/* @once */ dialog.content()}>
							<h1 class={/* @once */ dialog.title()}>Subscribe to this list?</h1>

							<p class="mt-3 text-sm">
								You're about to subscribe to <strong>{list().name.value}</strong>, what would you like to do
								with this list?
							</p>

							<div class="-mx-4 mt-3 flex flex-col">{renderOptions()}</div>

							<div class={/* @once */ dialog.actions()}>
								<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
									Cancel
								</button>
								<button
									disabled={!chosen()}
									onClick={() => {
										const $chosen = chosen();

										closeModal();

										if ($chosen) {
											act($chosen.value);
										}
									}}
									class={/* @once */ button({ color: 'primary' })}
								>
									Subscribe
								</button>
							</div>
						</div>
					);
				}}
			</Match>
		</Switch>
	);
};

export default SubscribeListDialog;
