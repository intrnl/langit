import { createIntegration } from '@solidjs/router';

// We need the ability to associate certain data to a specific history entry.
// These data doesn't have to be permanently attached, it would be great if it
// resets on reload even.

export const ENTRY_KEY = ':key';

export const pathIntegration = () => {
	// The initial navigation will not have an entry key, so we'll set that up.
	if (history.state?.[ENTRY_KEY]) {
		history.replaceState({ ...history.state, [ENTRY_KEY]: createKey() }, '', location.href);
	}

	return createIntegration(
		() => ({
			value: window.location.pathname + window.location.search + window.location.hash,
			state: history.state,
		}),
		({ value, replace, scroll, state }) => {
			state = { ...state as any, [ENTRY_KEY]: createKey() };

			if (replace) {
				window.history.replaceState(state, '', value);
			}
			else {
				window.history.pushState(state, '', value);
			}

			scrollToHash(window.location.hash.slice(1), scroll);
		},
		(notify) => bindEvent(window, 'popstate', () => notify()),
		{
			go: (delta) => window.history.go(delta),
		},
	);
};

const createKey = () => {
	return Date.now().toString(36);
};

const scrollToHash = (hash: string, fallbackTop?: boolean) => {
	const el = querySelector(`#${hash}`);
	if (el) {
		el.scrollIntoView();
	}
	else if (fallbackTop) {
		window.scrollTo(0, 0);
	}
};

const bindEvent = (target: EventTarget, type: string, handler: EventListener) => {
	target.addEventListener(type, handler);
	return () => target.removeEventListener(type, handler);
};

const querySelector = <T extends Element>(selector: string) => {
	// Guard against selector being an invalid CSS selector
	try {
		return document.querySelector<T>(selector);
	}
	catch (e) {
		return null;
	}
};
