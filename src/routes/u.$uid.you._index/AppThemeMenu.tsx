import { createMemo } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { type LocalPreference, getLocalPref } from '~/globals/settings.ts';

import * as menu from '~/styles/primitives/menu.ts';

import CheckIcon from '~/icons/baseline-check.tsx';

const AppThemeMenu = () => {
	const theme = createMemo(() => {
		const prefs = getLocalPref();
		return prefs.theme;
	});

	const setTheme = (next: LocalPreference['theme']) => {
		const prefs = getLocalPref();
		prefs.theme = next;
	};

	return (
		<div class={/* @once */ menu.content()}>
			<h1 class={/* @once */ menu.title()}>Application theme</h1>

			<button
				onClick={() => setTheme('light')}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': theme() === 'light' }}
			>
				<span class="grow">Light theme</span>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>
			<button
				onClick={() => setTheme('dark')}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': theme() === 'dark' }}
			>
				<span class="grow">Dark theme</span>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>
			<button
				onClick={() => setTheme('auto')}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': theme() === 'auto' }}
			>
				<span class="grow">Automatic</span>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default AppThemeMenu;
