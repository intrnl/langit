const json = (data: any, init?: number | ResponseInit) => {
	const opts = typeof init === 'number' ? { status: init } : init;
	const headers = new Headers(opts?.headers);

	if (!headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json; charset=utf-8');
	}

	return new Response(JSON.stringify(data), { ...opts, headers });
};

export const onRequest: PagesFunction = async (context) => {
	const request = context.request;
	const { searchParams } = new URL(request.url);

	const isDev = request.headers.get('origin') === null;

	const sl = searchParams.get('sl');
	const tl = searchParams.get('tl');
	const text = searchParams.get('text');

	if (request.method !== 'GET') {
		return json({ state: 'NOT_ALLOWED' }, { status: 405 });
	}
	if (sl == null || tl == null || text == null) {
		return json({ state: 'INCOMPLETE_REQUEST' }, { status: 400 });
	}

	const url = new URL(
		'https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dj=1&source=input',
	);
	url.searchParams.set('sl', sl);
	url.searchParams.set('tl', tl);
	url.searchParams.set('q', text);

	const res = await fetch(url, {
		cf: {
			cacheEverything: true,
			cacheTtlByStatus: {
				'200-299': 86400,
			},
		},
	});

	if (!res.ok) {
		return json(
			{
				state: 'TRANSLATE_ERROR',
				status: res.status,
			},
			{ status: 503 },
		);
	}

	const body: any = await res.json();

	return json(
		{
			state: 'TRANSLATED',
			result: body.sentences.map((n: any) => (n && n.trans) || '').join(''),
			source: body.ld_result.srclangs,
			raw: body,
		},
		{
			status: 200,
			headers: {
				'cache-control': !isDev ? 'max-age=86400' : '',
			},
		},
	);
};
