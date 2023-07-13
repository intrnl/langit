// This isn't a full-blown virtual list solution, but it's close to being one.

import type { JSX } from 'solid-js/jsx-runtime';

import { Show, batch, createSignal } from 'solid-js';

import { createStore, reconcile } from 'solid-js/store';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { scrollObserver } from '~/utils/intersection-observer.ts';
import { debounce } from '~/utils/misc.ts';

interface CachedHeightStore {
	[key: string]: { [id: string]: number };
}

const [store, setStore] = createStore<CachedHeightStore>({});
const makeEmpty = reconcile({});

let cachedWidth: number | undefined = undefined;

const resizeListener = () => {
	const next = window.innerWidth;

	if (cachedWidth !== next) {
		cachedWidth = next;
		setStore(makeEmpty);
	}
};

window.addEventListener('resize', debounce(resizeListener, 500, true));

let hasBoundingRectBug: boolean | undefined;

const getRectFromEntry = (entry: IntersectionObserverEntry) => {
	if (typeof hasBoundingRectBug !== 'boolean') {
		const boundingRect = entry.target.getBoundingClientRect();
		const observerRect = entry.boundingClientRect;

		hasBoundingRectBug =
			boundingRect.height !== observerRect.height ||
			boundingRect.top !== observerRect.top ||
			boundingRect.width !== observerRect.width ||
			boundingRect.bottom !== observerRect.bottom ||
			boundingRect.left !== observerRect.left ||
			boundingRect.right !== observerRect.right;
	}

	return hasBoundingRectBug ? entry.target.getBoundingClientRect() : entry.boundingClientRect;
};

export interface VirtualContainerProps {
	key: string;
	id: string;
	observer?: IntersectionObserver;
	children?: JSX.Element;
}

export const createPostKey = (cid: string, parent: boolean, next: boolean) => {
	return `${cid}:${+parent}${+next}`;
};

const VirtualContainer = (props: VirtualContainerProps) => {
	const [intersecting, setIntersecting] = createSignal(false);
	const [hidden, setHidden] = createSignal(false);

	const cachedHeight = () => store[props.key]?.[props.id];

	let height: number | undefined;
	let entry: IntersectionObserverEntry | undefined;

	const calculateHeight = () => {
		const next = getRectFromEntry(entry!).height;

		if (next !== height) {
			height = next;

			if (props.key in store) {
				setStore(props.key, props.id, height);
			} else {
				setStore(props.key, { [props.id]: height });
			}
		}
	};

	const hideElement = () => {
		setHidden(!intersecting());
	};

	const listener = debounce((next: IntersectionObserverEntry) => {
		entry = next;

		batch(() => {
			setIntersecting(next.isIntersecting);
			setHidden(false);
		});

		scheduleIdleTask(calculateHeight);

		if (intersecting() && !next.isIntersecting) {
			scheduleIdleTask(hideElement);
		}
	}, 150);

	const observer = () => props.observer || scrollObserver;
	const setRef = (node: HTMLElement) => observer().observe(node);

	const shouldHide = () => !intersecting() && (hidden() || cachedHeight());

	return (
		<article
			ref={setRef}
			style={{ height: shouldHide() ? `${height || cachedHeight()}px` : undefined }}
			prop:$onintersect={listener}
		>
			<Show when={!shouldHide()}>{props.children}</Show>
		</article>
	);
};

export default VirtualContainer;
