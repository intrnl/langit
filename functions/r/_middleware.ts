import { renderFeed } from './_renderers/feed.ts';
import { renderPost } from './_renderers/post.ts';
import { renderProfile } from './_renderers/profile.ts';

const PROFILE_MATCHER = new URLPattern({ pathname: '/r/profile/:actor' });
const POST_MATCHER = new URLPattern({ pathname: '/r/profile/:actor/post/:post' });
const FEED_MATCHER = new URLPattern({ pathname: '/r/profile/:actor/feed/:feed' });

const UA_RE =
	/Discordbot|Slackbot|WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|Viber|Linespider|MicroMessenger|WeChat|snapchat|SkypeUriPreview|Synapse|Googlebot|bingbot|YandexBot/;

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

	const ua = request.headers.get('user-agent');

	if (ua && UA_RE.test(ua)) {
		try {
			const url = new URL(request.url);

			let match: URLPatternURLPatternResult | null;
			let head: string | undefined;

			if ((match = PROFILE_MATCHER.exec(url))) {
				const { actor } = match.pathname.groups;

				head = await renderProfile(actor);
			} else if ((match = POST_MATCHER.exec(url))) {
				const { actor, post } = match.pathname.groups;

				head = await renderPost(actor, post);
			} else if ((match = FEED_MATCHER.exec(url))) {
				const { actor, feed } = match.pathname.groups;

				head = await renderFeed(actor, feed);
			}

			if (head) {
				return appendHead(response, head);
			}
		} catch (err) {
			console.log(`failed to render preview`);
			console.error(err);
		}
	}

	return response;
};
