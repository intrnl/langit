import { renderPost } from './_renderers/post.ts';
import { renderProfile } from './_renderers/profile.ts';

const PROFILE_MATCHER = new URLPattern({ pathname: '/r/profile/:actor' });
const POST_MATCHER = new URLPattern({ pathname: '/r/profile/:actor/post/:post' });

const appendHead = (response: Response, content: string) => {
	const handler: HTMLRewriterElementContentHandlers = {
		element: (element) => {
			element.after(content, { html: true });
		},
	};

	return new HTMLRewriter().on('meta[charset]', handler).transform(response);
};

export const onRequest: PagesFunction = async (context) => {
	const { request } = context;

	const response = await context.next();

	try {
		const url = new URL(request.url);

		let match: URLPatternURLPatternResult | null;

		if ((match = PROFILE_MATCHER.exec(url))) {
			const { actor } = match.pathname.groups;

			return appendHead(response, await renderProfile(actor));
		} else if ((match = POST_MATCHER.exec(url))) {
			const { actor, post } = match.pathname.groups;

			return appendHead(response, await renderPost(actor, post));
		}
	} catch (err) {
		console.log(`failed to render preview`);
		console.error(err);
	}

	return response;
};
