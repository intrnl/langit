// This is a general use-case implementation for rendering children components
// only when it's visible on viewport

// By default, it will render the children, measure the height of the container,
// persists them and unmounts the render if it is outside of the viewport

// This default approach is fine for lists that starts out small and expands
// over time, but not for scenarios where you know you'd be rendering a large
// list with more than 250 items, in which case an `estimateHeight` can be
// provided as a baseline it can use

import type { JSX } from 'solid-js/jsx-runtime';

import { Show, createSignal } from 'solid-js';

import { createMutable } from 'solid-js/store';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { scrollObserver } from '~/utils/intersection-observer.ts';

let hasBoundingRectBug: boolean | undefined;

const mutable = createMutable<Record<string, number>>({});

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
	id: string;
	estimateHeight?: number;
	children?: JSX.Element;
}

export const createPostKey = (cid: string, parent: boolean, next: boolean) => {
	return `posts/${cid}:${+parent}${+next}`;
};

const VirtualContainer = (props: VirtualContainerProps) => {
	let height: number | undefined;
	let entry: IntersectionObserverEntry | undefined;

	const [intersecting, setIntersecting] = createSignal(false);
	const estimateHeight = props.estimateHeight;

	const cachedHeight = () => mutable[props.id] ?? estimateHeight;

	const calculateHeight = () => {
		const next = getRectFromEntry(entry!).height;

		if (next !== height) {
			height = next;
			mutable[props.id] = height;
		}
	};

	const listener = (next: IntersectionObserverEntry) => {
		const intersect = next.isIntersecting;

		entry = next;

		if (intersect && !intersecting()) {
			scheduleIdleTask(calculateHeight);
		}

		setIntersecting(intersect);
	};

	const measure = (node: HTMLElement) => scrollObserver.observe(node);
	const shouldHide = () => !intersecting() && cachedHeight();

	return (
		<article
			ref={measure}
			style={{ height: shouldHide() ? `${height || cachedHeight()}px` : undefined }}
			prop:$onintersect={listener}
		>
			<Show when={!shouldHide()}>{props.children}</Show>
		</article>
	);
};

export default VirtualContainer;
