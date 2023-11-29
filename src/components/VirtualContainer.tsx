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
import { getRectFromEntry, scrollObserver } from '~/utils/intersection-observer.ts';

const cachedHeights = createMutable<Record<string, number>>({});

const isMobile = /Android/.test(navigator.userAgent);

export interface VirtualContainerProps {
	id: string;
	estimateHeight?: number;
	children?: JSX.Element;
}

const VirtualContainer = (props: VirtualContainerProps) => {
	let height: number | undefined;
	let entry: IntersectionObserverEntry | undefined;

	const [intersecting, setIntersecting] = createSignal(false);
	const estimateHeight = props.estimateHeight;

	const calculateHeight = () => {
		const nextHeight = getRectFromEntry(entry!).height;

		if (nextHeight !== height) {
			cachedHeights[props.id] = height = nextHeight;
		}
	};

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		const prev = intersecting();
		const next = nextEntry.isIntersecting;

		entry = nextEntry;

		// @todo: figure out why this is at all.
		// after scratching my head on and off for 12 hours, I've concluded that:
		//
		// 1. the broken assumption around how the virtual container attempts to
		//    store the height of items somehow makes scroll restoration work.
		//
		// 2. fixing this broken assumption somehow breaks scroll restoration.
		//
		// 3. this only happens on mobile browsers.
		//
		// my only assumption is that mobile phones are slow, but I am not willing
		// to spend more hours on this for now.

		if (!isMobile) {
			// new behavior.

			if (!prev && next) {
				// hidden -> visible
				// immediately mount the new items, but schedule a task to update the
				// cached height, this handles the scenario where the virtual container
				// is being unmounted for page loads as an example.
				setIntersecting(next);

				scheduleIdleTask(() => {
					// bail out if it's no longer us.
					if (entry !== nextEntry) {
						return;
					}

					calculateHeight();
				});
			} else if (prev && !next) {
				// visible -> hidden
				// unmounting is cheap, but we don't need to immediately unmount it, say
				// for scenarios where layout is still being figured out and we don't
				// actually know where the virtual container is gonna end up.
				scheduleIdleTask(() => {
					// bail out if it's no longer us.
					if (entry !== nextEntry) {
						return;
					}

					calculateHeight();
					setIntersecting(next);
				});
			}
		} else {
			// old behavior.

			if (!prev && next) {
				// hidden -> visible
				scheduleIdleTask(calculateHeight);
			}

			setIntersecting(next);
		}
	};

	const measure = (node: HTMLElement) => scrollObserver.observe(node);

	const cachedHeight = () => cachedHeights[props.id] ?? estimateHeight;
	const shouldHide = () => !intersecting() && cachedHeight();

	return (
		<article
			ref={measure}
			style={{ height: shouldHide() ? `${height || cachedHeight()}px` : undefined }}
			prop:$onintersect={handleIntersect}
		>
			<Show when={!shouldHide()}>{props.children}</Show>
		</article>
	);
};

export default VirtualContainer;
