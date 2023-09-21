import { Match, Show, Switch, createRenderEffect, createSignal } from 'solid-js';

import type { DID, RefOf, ResponseOf } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, useModalState } from '~/globals/modals.tsx';
import { model } from '~/utils/misc.ts';

import button from '~/styles/primitives/button';
import * as dialog from '~/styles/primitives/dialog.ts';
import input from '~/styles/primitives/input.ts';

type AppPassword = RefOf<'com.atproto.server.listAppPasswords#appPassword'>;

export interface AddAppPasswordDialogProps {
	uid: DID;
	passwords: AppPassword[];
	onAdd: () => void;
}

const enum FormState {
	IDLE,
	LOADING,
}

type CreatedAppPassword = ResponseOf<'com.atproto.server.createAppPassword'>;

const AddAppPasswordDialog = (props: AddAppPasswordDialogProps) => {
	const modal = useModalState();

	const [state, setState] = createSignal(FormState.IDLE);
	const [error, setError] = createSignal('');

	const [response, setResponse] = createSignal<CreatedAppPassword>();

	const [name, setName] = createSignal('');

	const handleSubmit = async (ev: SubmitEvent) => {
		const $name = name().trim();
		const $passwords = props.passwords;

		ev.preventDefault();

		if (state() !== FormState.IDLE) {
			return;
		}

		if ($name.length < 1) {
			setError(`Name cannot be empty`);
			return;
		}

		if ($passwords.find((pass) => pass.name === $name)) {
			setError(`An app password with this name already exists.`);
			return;
		}

		setState(FormState.IDLE);
		setError('');

		let data: CreatedAppPassword | undefined;

		try {
			const agent = await multiagent.connect(props.uid);

			const response = await agent.rpc.call('com.atproto.server.createAppPassword', {
				data: {
					name: $name,
				},
			});

			data = response.data;
		} catch (err) {
			setError(`Failed to create app password, try again later.`);
		}

		if (data) {
			setResponse(data);
			props.onAdd();
		}

		setState(FormState.IDLE);
	};

	createRenderEffect(() => {
		modal.disableBackdropClose.value = state() !== FormState.IDLE;
	});

	return (
		<Switch>
			<Match when={response()} keyed>
				{(response) => {
					const [copied, setCopied] = createSignal(false);

					return (
						<div class={/* @once */ dialog.content()}>
							<h1 class={/* @once */ dialog.title()}>App password created</h1>

							<p class="my-3 text-sm">
								<strong>{response.name}</strong> has been created, you'll have to use this password when
								signing in to other apps or services.
							</p>

							<input
								type="text"
								readOnly
								value={response.password}
								class={/* @once */ input({ class: 'text-center font-mono' })}
							/>

							<p class="mt-3 text-sm text-muted-fg">
								For security reasons, this password will no longer be shown again. If you lose this password,
								revoke it and generate a new one.
							</p>

							<div class={/* @once */ dialog.actions()}>
								<button
									disabled={copied()}
									onClick={() => {
										navigator.clipboard.writeText(response.password).then(() => {
											setCopied(true);
											setTimeout(() => setCopied(false), 1000);
										});
									}}
									class={/* @once */ button({ color: 'outline' })}
								>
									{!copied() ? 'Copy password' : 'Copied!'}
								</button>
								<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
									Close
								</button>
							</div>
						</div>
					);
				}}
			</Match>

			<Match when>
				<form onSubmit={handleSubmit} class={/* @once */ dialog.content()}>
					<fieldset disabled={state() !== FormState.IDLE}>
						<h1 class={/* @once */ dialog.title()}>Add new app password</h1>

						<p class="my-3 text-sm">Enter a unique name for this app password</p>

						<input
							ref={model(name, setName)}
							type="text"
							class={/* @once */ input()}
							required
							minLength={4}
							maxLength={32}
							pattern="[a-zA-Z0-9\\-_ ]+"
							title="Name can only contain letters, numbers, spaces, dashes and underscores"
						/>

						<Show when={error()}>{(error) => <p class="mt-3 text-sm text-red-600">{error()}</p>}</Show>

						<div class={/* @once */ dialog.actions()}>
							<button type="button" onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
								Cancel
							</button>
							<button type="submit" class={/* @once */ button({ color: 'primary' })}>
								Add
							</button>
						</div>
					</fieldset>
				</form>
			</Match>
		</Switch>
	);
};

export default AddAppPasswordDialog;
