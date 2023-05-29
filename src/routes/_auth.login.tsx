import { Show, createSignal } from 'solid-js';

import { useSearchParams, useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { DEFAULT_DATA_SERVERS } from '~/api/defaults.ts';
import { multiagent } from '~/api/global.ts';
import { XRPC } from '~/api/rpc/xrpc.ts';

import { model } from '~/utils/misc.ts';

import Dialog from '~/components/Dialog.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import input from '~/styles/primitives/input.ts';

const APP_PASSWORD_REGEX = /^[a-zA-Z\d]{4}(-[a-zA-Z\d]{4}){3}$/;
const APP_PASSWORD_LINK = 'https://github.com/bluesky-social/atproto-ecosystem/blob/main/app-passwords.md';

const AuthLoginPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams<{ to?: string }>();

	const [service, setService] = createSignal(DEFAULT_DATA_SERVERS[0]);
	const [dispatching, setDispatching] = createSignal(false);

	const [error, setError] = createSignal('');

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	const [isNoticeOpen, setIsNoticeOpen] = createSignal(false);

	const describeQuery = createQuery(
		() => ['describeServer', service().url],
		async (query) => {
			const rpc = new XRPC(service().url);

			const res = await rpc.get({
				method: 'com.atproto.server.describeServer',
				signal: query.signal,
			});

			return res.data;
		},
	);

	const submit = (force: boolean) => {
		const $url = service().url;
		const $identifier = identifier();
		const $password = password();

		setError('');

		if (!force && !APP_PASSWORD_REGEX.test($password)) {
			setIsNoticeOpen(true);
			return;
		}

		setDispatching(true);

		multiagent.login({ service: $url, identifier: $identifier, password: $password }).then(
			(uid) => {
				const to = searchParams.to;

				if (to) {
					navigate(to.replace(`@uid/`, `/u/${uid}/`));
				} else {
					navigate(`/u/${uid}`);
				}
			},
			(err) => {
				const message = err.cause ? err.cause.message : err.message;
				setError(message);
				setDispatching(false);
			},
		);
	};

	return (
		<div class="mx-auto max-w-xl px-4 py-8">
			<h1 class="mb-8 text-lg font-bold">Login</h1>

			<form
				onSubmit={(ev) => {
					ev.preventDefault();
					submit(false);
				}}
				class="flex flex-col gap-4"
			>
				<Show when={searchParams.to}>
					<div class="rounded bg-secondary p-3 text-sm text-secondary-fg">You need to login to continue</div>
				</Show>

				<div class="flex items-center gap-1 text-sm">
					<span class="font-medium text-muted-fg">Connecting to</span>
					<span class="grow font-medium text-primary">{service().name}</span>

					<button disabled type="button" class={/* @once */ button({ color: 'outline' })}>
						Change
					</button>
				</div>

				<div class="flex flex-col gap-2">
					<label for="user" class="block text-sm font-medium leading-6 text-primary">
						Identifier
					</label>
					<input
						ref={model(identifier, setIdentifier)}
						type="text"
						id="user"
						required
						autocomplete="username"
						class={/* @once */ input()}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label for="pwd" class="block text-sm font-medium leading-6 text-primary">
						Password
					</label>
					<input
						ref={model(password, setPassword)}
						type="password"
						id="pwd"
						required
						autocomplete="password"
						class={/* @once */ input()}
					/>
				</div>

				<Show when={error()}>{(error) => <p class="text-sm leading-6 text-red-600">{error()}</p>}</Show>

				<Show when={describeQuery.data}>
					{(data) => (
						<p class="text-sm leading-6 text-muted-fg">
							By continuing, you agree to the service's{' '}
							<a href={data().links.termsOfService} class="text-primary hover:underline">
								Terms of Service
							</a>{' '}
							and{' '}
							<a href={data().links.privacyPolicy} class="text-primary hover:underline">
								Privacy Policy
							</a>
							.
						</p>
					)}
				</Show>

				<div>
					<button
						disabled={dispatching() || describeQuery.isLoading}
						type="submit"
						class={/* @once */ button({ color: 'primary' })}
					>
						Login
					</button>
				</div>
			</form>

			<Dialog open={isNoticeOpen()} onClose={() => setIsNoticeOpen(false)}>
				<div class={/* @once */ dialog.content()}>
					<h1 class={/* @once */ dialog.title()}>Password notice</h1>

					<p class="mt-3 text-sm">
						You seem to be attempting to login with your regular password. For your safety, we recommend using
						app passwords when trying to sign in to third-party clients such as Langit.{' '}
						<a
							href={APP_PASSWORD_LINK}
							target="_blank"
							rel="noopener noreferrer nofollow"
							class="text-accent hover:underline"
						>
							Learn more here
						</a>
						.
					</p>

					<div class={/* @once */ dialog.actions()}>
						<button
							onClick={() => {
								setIsNoticeOpen(false);
							}}
							class={/* @once */ button({ color: 'ghost' })}
						>
							Cancel
						</button>
						<button
							onClick={() => {
								setIsNoticeOpen(false);
								submit(true);
							}}
							class={/* @once */ button({ color: 'primary' })}
						>
							Log in anyway
						</button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default AuthLoginPage;
