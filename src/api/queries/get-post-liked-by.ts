import { type QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListPage } from '../models/profiles-list.ts';

import { type BskyGetLikesResponse } from '../types.ts';
import { type Collection, type DID, pushCollection } from '../utils.ts';

import _getDid from './_did.ts';

export const getPostLikedByKey = (uid: DID, actor: string, post: string, limit: number) =>
	['getPostLikes', uid, actor, post, limit] as const;
export const getPostLikedBy: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof getPostLikedByKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, actor, post, limit] = key;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor);

	const uri = `at://${did}/app.bsky.feed.post/${post}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getLikes',
		params: { uri, limit, cursor: param },
	});

	const data = response.data as BskyGetLikesResponse;
	const page: ProfilesListPage = {
		cursor: data.cursor,
		profiles: data.likes.map((record) => mergeSignalizedProfile(record.actor)),
	};

	return pushCollection(collection, page, param);
};
