// This is a general use-case implementation for rendering children components
// only when it's visible on viewport

// By default, it will render the children, measure the height of the container,
// persists them and unmounts the render if it is outside of the viewport

// This default approach is fine for lists that starts out small and expands
// over time, but not for scenarios where you know you'd be rendering a large
// list with more than 250 items, in which case an `estimateHeight` can be
// provided as a baseline it can use

import type { JSX } from 'solid-js/jsx-runtime';

import { batch, createSignal } from 'solid-js';

import { createMutable } from 'solid-js/store';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { getRectFromEntry, scrollObserver } from '~/utils/intersection-observer.ts';

const cachedHeights = createMutable<Record<string, number>>({});

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

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		const prev = intersecting();
		const next = nextEntry.isIntersecting;

		entry = nextEntry;

		scheduleIdleTask(() => {
			// Bail out if it's no longer entry.
			if (entry !== nextEntry) {
				return;
			}

			if (!prev && next) {
				setIntersecting(next);
			} else if (prev && !next) {
				const nextHeight = getRectFromEntry(nextEntry!).height;
				const truncatedHeight = Math.trunc(nextHeight * 100) / 100;

				if (truncatedHeight !== height) {
					batch(() => {
						height = truncatedHeight;
						cachedHeights[props.id] = truncatedHeight;

						setIntersecting(next);
					});
				} else {
					setIntersecting(next);
				}
			}
		});
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
			{(() => {
				if (!shouldHide()) {
					return props.children;
				}
			})()}
		</article>
	);
};

export default VirtualContainer;
