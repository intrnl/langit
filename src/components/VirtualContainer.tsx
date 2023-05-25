// This isn't a full-blown virtual list solution, but it's close to being one.

import { type JSX } from 'solid-js/jsx-runtime';

import { Show, batch, createEffect, createSignal, onCleanup } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { type IntersectionObserverWrapper } from '~/utils/intersection-observer.ts';
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

		hasBoundingRectBug = boundingRect.height !== observerRect.height ||
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
	observer: IntersectionObserverWrapper;
	children?: JSX.Element;
}

export const createPostKey = (cid: string, parent: boolean, next: boolean) => {
	return `${cid}:${+parent}${+next}`;
};

const VirtualContainer = (props: VirtualContainerProps) => {
	const [intersecting, setIntersecting] = createSignal(false);
	const [hidden, setHidden] = createSignal(false);
	const [ref, setRef] = createSignal<HTMLElement>();

	const cachedHeight = () => store[props.key]?.[props.id];
	const observerKey = () => `${props.key}::${props.id}`;

	let height: number | undefined;
	let entry: IntersectionObserverEntry | undefined;

	const calculateHeight = () => {
		height = getRectFromEntry(entry!).height;

		if (props.key in store) {
			setStore(props.key, props.id, height);
		}
		else {
			setStore(props.key, { [props.id]: height });
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

	createEffect(() => {
		const observer = props.observer;
		const id = observerKey();
		const node = ref();

		if (!node) {
			return;
		}

		observer.observe(id, node, listener);

		onCleanup(() => observer.unobserve(id, node));
	});

	return (
		<Show
			when={!intersecting() && (hidden() || cachedHeight())}
			fallback={
				<article
					ref={setRef}
					data-id={observerKey()}
					class='animate-in fade-in duration-100'
				>
					{props.children}
				</article>
			}
		>
			<article
				ref={setRef}
				style={{ height: `${height || cachedHeight()}px` }}
				data-id={observerKey()}
			/>
		</Show>
	);
};

export default VirtualContainer;
