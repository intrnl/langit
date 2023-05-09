import { createQuery } from '@tanstack/solid-query';
import { Show, createSignal } from 'solid-js';

import { DEFAULT_DATA_SERVERS } from '~/api/defaults';
import { multiagent } from '~/api/global';
import { useNavigate } from '~/router';
import { XRPC } from '~/utils/xrpc';

import button from '~/styles/primitives/button.css';

const AuthLoginPage = () => {
	const navigate = useNavigate();

	const [service, setService] = createSignal(DEFAULT_DATA_SERVERS[0]);
	const [dispatching, setDispatching] = createSignal(false);

	const describeQuery = createQuery(() => ['describeServer', service().url], async (query) => {
		const rpc = new XRPC(service().url);

		const res = await rpc.get({
			method: 'com.atproto.server.describeServer',
			signal: query.signal,
		});

		return res.data;
	});

	return (
		<div class='max-w-xl mx-auto px-4 py-8'>
			<h1 class='mb-8 text-lg font-bold'>Login</h1>

			<form
				onSubmit={(ev) => {
					const form = new FormData(ev.currentTarget);

					const url = service().url;
					const identifier = form.get('user') as string;
					const password = form.get('pwd') as string;

					ev.preventDefault();
					setDispatching(true);

					multiagent.login({ service: url, identifier, password }).then(
						(uid) => {
							navigate(`/u/:uid`, { params: { uid } });
						},
						(err) => {
							console.error(err);
							setDispatching(false);
						},
					);
				}}
				class='flex flex-col gap-4'
			>
				<div class='flex gap-1 items-center text-sm'>
					<span class='font-medium text-gray-600'>Connecting to</span>
					<span class='font-medium text-gray-900 grow'>{service().name}</span>

					<button disabled type='button' class={button()}>change</button>
				</div>

				<div class='flex flex-col gap-2'>
					<label for='user' class='block text-sm font-medium leading-6 text-gray-900'>
						Identifier
					</label>
					<input
						type='text'
						name='user'
						id='user'
						required
						autocomplete='username'
						class='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6'
					/>
				</div>

				<div class='flex flex-col gap-2'>
					<label for='pwd' class='block text-sm font-medium leading-6 text-gray-900'>
						Password
					</label>
					<input
						type='password'
						name='pwd'
						id='pwd'
						required
						autocomplete='password'
						class='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 text-sm leading-6'
					/>
				</div>

				<Show when={describeQuery.data} keyed>
					{(data) => (
						<p class='leading-6 text-gray-600 text-xs'>
							By continuing, you agree to the service's{' '}
							<a href={data.links.termsOfService} class='hover:underline text-indigo-600'>Terms of Service</a> and{' '}
							<a href={data.links.privacyPolicy} class='hover:underline text-indigo-600'>Privacy Policy</a>.
						</p>
					)}
				</Show>

				<div>
					<button
						disabled={dispatching() || describeQuery.isLoading}
						type='submit'
						class={button({ color: 'primary' })}
					>
						login
					</button>
				</div>
			</form>
		</div>
	);
};

export default AuthLoginPage;
