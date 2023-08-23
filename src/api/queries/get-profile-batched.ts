import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';
import { createBatchedFetch } from '~/utils/batch-fetch.ts';

type ProfileData = RefOf<'app.bsky.actor.defs#profileViewDetailed'>;
type Query = [uid: DID, actor: DID];

export const fetchProfileBatched = createBatchedFetch<Query, string, ProfileData>({
	limit: 25,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => query[1],
	idFromData: (data) => data.did,
	fetch: async (queries) => {
		const uid = queries[0][0];
		const actors = queries.map((query) => query[1]);

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.actor.getProfiles', {
			params: {
				actors,
			},
		});

		const profiles = response.data.profiles;
		return profiles;
	},
});
