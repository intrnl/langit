import { Show, createSignal } from 'solid-js';

import { Agent } from '@intrnl/bluesky-client/agent';
import { createMutation, createQuery, useQueryMutation } from '@intrnl/sq';
import { useNavigate, useSearchParams } from '@solidjs/router';

import { DEFAULT_DATA_SERVERS } from '~/api/defaults.ts';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { model } from '~/utils/misc.ts';

import AppPasswordNoticeDialog from '~/components/dialogs/AppPasswordNoticeDialog.tsx';
import button from '~/styles/primitives/button.ts';
import input from '~/styles/primitives/input.ts';

const APP_PASSWORD_REGEX = /^[a-zA-Z\d]{4}(-[a-zA-Z\d]{4}){3}$/;

const AuthLoginPage = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams<{ to?: string }>();

	const [service, _setService] = createSignal(DEFAULT_DATA_SERVERS[0]);

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	const mutate = useQueryMutation();

	const [description] = createQuery({
		key: () => ['describeServer', service().url] as const,
		fetch: async ([, serviceUri]) => {
			const agent = new Agent({ serviceUri: serviceUri });
			const response = await agent.rpc.get('com.atproto.server.describeServer', {});

			return response.data;
		},
	});

	const loginMutation = createMutation({
		mutate: () => {
			const $url = service().url;
			const $identifier = identifier();
			const $password = password();

			return multiagent.login({ service: $url, identifier: $identifier, password: $password });
		},
		onSuccess: (uid) => {
			const to = searchParams.to;

			mutate(true, (key) => key.length >= 2 && key[1] === uid, undefined);

			if (to) {
				navigate(to.replace(`@uid/`, `/u/${uid}/`));
			} else {
				navigate(`/u/${uid}`);
			}
		},
	});

	const submit = (force: boolean) => {
		const $password = password();

		if (!force && !APP_PASSWORD_REGEX.test($password)) {
			openModal(() => <AppPasswordNoticeDialog onSubmit={() => submit(true)} />);
			return;
		}

		loginMutation.mutate(null);
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

				<Show when={loginMutation.error} keyed>
					{(error: any) => (
						<p class="text-sm leading-6 text-red-600">
							{error.cause ? error.cause.message : error.message || '' + error}
						</p>
					)}
				</Show>

				<Show when={description()}>
					{(data) => (
						<p class="text-sm leading-6 text-muted-fg">
							By continuing, you agree to the service's{' '}
							<a href={data().links?.termsOfService} class="text-primary hover:underline">
								Terms of Service
							</a>{' '}
							and{' '}
							<a href={data().links?.privacyPolicy} class="text-primary hover:underline">
								Privacy Policy
							</a>
							.
						</p>
					)}
				</Show>

				<div>
					<button
						disabled={loginMutation.isLoading || description.loading}
						type="submit"
						class={/* @once */ button({ color: 'primary' })}
					>
						Login
					</button>
				</div>
			</form>
		</div>
	);
};

export default AuthLoginPage;
