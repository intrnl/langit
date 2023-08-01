import { XRPC } from '@intrnl/bluesky-client/xrpc';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';
import type { DID, Procedures, Queries, Records, RefOf, ResponseOf } from '@intrnl/bluesky-client/atp-schema';

const POST_MATCHER = new URLPattern({ pathname: '/r/profile/:actor/post/:post' });
const INSTANCE_URL = `https://bsky.social`;

const rpc = new XRPC<Queries, Procedures>(INSTANCE_URL);

const resolveRepository = async (actor: string) => {
	const response = await rpc.get('com.atproto.repo.describeRepo', {
		params: {
			repo: actor,
		},
	});

	const data = response.data;
	return data;
};

const resolveProfile = async (did: DID) => {
	try {
		const response = await rpc.get('com.atproto.repo.getRecord', {
			params: {
				repo: did,
				collection: 'app.bsky.actor.profile',
				rkey: 'self',
			},
		});

		const data = response.data;
		return data.value as Records['app.bsky.actor.profile'];
	} catch (err) {
		if (err instanceof XRPCError) {
			if (err.error === 'InvalidRequest') {
				return null;
			}
		}

		throw err;
	}
};

const resolvePost = async (did: DID, post: string) => {
	const response = await rpc.get('com.atproto.repo.getRecord', {
		params: {
			repo: did,
			collection: 'app.bsky.feed.post',
			rkey: post,
		},
	});

	const data = response.data;
	return data.value as Records['app.bsky.feed.post'];
};

const escape = (value: string, isAttribute: boolean) => {
	const str = '' + value;

	let escaped = '';
	let last = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char === 38 || char === (isAttribute ? 34 : 60)) {
			escaped += str.substring(last, idx) + ('&#' + char + ';');
			last = idx + 1;
		}
	}

	if (last === 0) {
		return str;
	}

	return escaped + str.substring(last);
};

const renderPost = (
	post: Records['app.bsky.feed.post'],
	profile: Records['app.bsky.actor.profile'] | null,
	repo: ResponseOf<'com.atproto.repo.describeRepo'>,
) => {
	const embed = post.embed;

	const title = profile?.displayName ? `${profile.displayName} (${repo.handle})` : repo.handle;
	let image = '';

	if (embed) {
		const $type = embed.$type;

		let images: RefOf<'app.bsky.embed.images#image'>[] | undefined;

		if ($type === 'app.bsky.embed.images') {
			images = embed.images;
		} else if ($type === 'app.bsky.embed.recordWithMedia') {
			const media = embed.media;

			if (media.$type === 'app.bsky.embed.images') {
				images = media.images;
			}
		}

		if (images) {
			const tags = images.map((img) => {
				const url = `${INSTANCE_URL}/xrpc/com.atproto.sync.getBlob?did=${repo.did}&cid=${img.image.ref.$link}`;
				return `<meta property="og:image" content="${escape(url, true)}" />`;
			});

			image = tags.join('');
		}
	}

	return `
		<!doctype html>
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="theme-color" content="#0085ff" />
				<meta property="og:site_name" content="Langit" />
				<meta property="og:title" content="${escape(title, true)}" />
				<meta property="og:description" content="${escape(post.text, true)}" />
				${image}
			</head>
			<body>
				<p>You shouldn't be seeing this, are you a bot?</p>
			</body>
		</html>
	`;
};

const UA_RE = /\bDiscordbot\/\d+\.\d+\b/;

export const onRequest: PagesFunction = async (context) => {
	const { request } = context;

	const headers = request.headers;
	const ua = headers.get('user-agent');

	if (ua && UA_RE.test(ua)) {
		try {
			const url = request.url;

			let match: URLPatternURLPatternResult | null;

			if ((match = POST_MATCHER.exec(url))) {
				const { actor, post } = match.pathname.groups;

				const repo = await resolveRepository(actor);
				const profile = await resolveProfile(repo.did);
				const record = await resolvePost(repo.did, post);

				return new Response(renderPost(record, profile, repo), {
					headers: { 'content-type': 'text/html' },
				});
			}
		} catch (err) {
			console.log(`bot agent: ${ua}`);
			console.error(err);
		}
	} else if (ua) {
		console.log(`user agent: ${ua}`);
	}

	return await context.next();
};
