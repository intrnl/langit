import { type Facet } from './richtext/types.ts';
import { type DID } from './utils.ts';

export interface BskyLabel {
	cts: string;
	neg: false;
	src: string;
	uri: string;
	val: string;
}

export interface BskyProfile {
	did: DID;
	handle: string;
	displayName: string;
	description: string;
	avatar?: string;
	banner?: string;
	followersCount: number;
	followsCount: number;
	postsCount: number;
	indexedAt: string;
	labels: BskyLabel[];
	viewer: {
		muted: boolean;
		mutedByList?: BskyListBasic;
		blocking?: string;
		blockedBy: boolean;
		following?: string;
	};
}

export interface BskyProfileBasic {
	did: DID;
	handle: string;
	displayName: string;
	avatar?: string;
	labels: BskyLabel[];
	viewer: {
		muted: boolean;
		blockedBy: boolean;
		following?: string;
	};
}

export interface BskyProfileFollow {
	did: DID;
	handle: string;
	displayName: string;
	description: string;
	avatar?: string;
	labels: BskyLabel[];
	indexedAt: string;
	viewer: {
		muted: boolean;
		blockedBy: boolean;
		following?: string;
	};
}

export interface BskyProfileTypeaheadSearch {
	did: string;
	handle: string;
	displayName: string;
	avatar?: string;
	labels: BskyLabel[];
	viewer: {
		muted: boolean;
		blockedBy: boolean;
		following?: string;
	};
}

export interface BskyPostRecordEmbedImage {
	$type: 'app.bsky.embed.images';
	images: Array<{
		alt: string;
		image: BskyBlob;
	}>;
}

export interface BskyPostRecordEmbedExternal {
	$type: 'app.bsky.embed.external';
	external: {
		uri: string;
		title: string;
		description: string;
		thumb?: BskyBlob;
	};
}

export interface BskyPostRecordEmbedRecord {
	$type: 'app.bsky.embed.record';
	record: {
		cid: string;
		uri: string;
	};
}

export interface BskyPostRecordEmbedRecordWithMedia {
	$type: 'app.bsky.embed.recordWithMedia';
	media: BskyPostRecordEmbedImage | BskyPostRecordEmbedExternal;
	record: BskyPostRecordEmbedRecord;
}

export interface BskyPostRecordReply {
	cid: string;
	uri: string;
}

export interface BskyPostRecord {
	$type: 'app.bsky.feed.post';
	text: string;
	facets?: Facet[];
	createdAt: string;
	reply?: {
		root: BskyPostRecordReply;
		parent: BskyPostRecordReply;
	};
	embed?:
		| BskyPostRecordEmbedExternal
		| BskyPostRecordEmbedImage
		| BskyPostRecordEmbedRecord
		| BskyPostRecordEmbedRecordWithMedia;
}

export interface EmbeddedLink {
	$type: 'app.bsky.embed.external#viewExternal';
	uri: string;
	title: string;
	description: string;
	thumb?: string;
}

export interface BskyPostEmbedLink {
	$type: 'app.bsky.embed.external#view';
	external: EmbeddedLink;
}

export interface EmbeddedImage {
	$type: 'app.bsky.embed.images#viewImage';
	thumb: string;
	fullsize: string;
	alt: string;
}

export interface BskyPostEmbedImage {
	$type: 'app.bsky.embed.images#view';
	images: EmbeddedImage[];
}

export interface EmbeddedPostRecord {
	$type: 'app.bsky.embed.record#viewRecord';
	uri: string;
	cid: string;
	author: BskyProfileBasic;
	value: any;
	labels?: BskyLabel[];
	embeds?: Array<BskyPostEmbedLink | BskyPostEmbedImage | BskyPostEmbedRecord | BskyPostEmbedRecordWithMedia>;
	indexedAt?: string;
}

export interface EmbeddedGeneratorRecord extends BskyFeedGenerator {
	$type: 'app.bsky.feed.defs#generatorView';
}

export interface EmbeddedRecordNotFound {
	$type: 'app.bsky.embed.record#viewNotFound';
	uri: string;
}

export interface EmbeddedRecordBlocked {
	$type: 'app.bsky.embed.record#viewBlocked';
	uri: string;
}

export interface BskyPostEmbedRecord {
	$type: 'app.bsky.embed.record#view';
	record: EmbeddedGeneratorRecord | EmbeddedPostRecord | EmbeddedRecordNotFound | EmbeddedRecordBlocked;
}

export interface BskyPostEmbedRecordWithMedia {
	$type: 'app.bsky.embed.recordWithMedia#view';
	record: BskyPostEmbedRecord;
	media: BskyPostEmbedLink | BskyPostEmbedImage;
}

export interface BskyPost {
	uri: string;
	cid: string;
	author: BskyProfileBasic;
	record: BskyPostRecord;
	embed?: BskyPostEmbedLink | BskyPostEmbedImage | BskyPostEmbedRecord | BskyPostEmbedRecordWithMedia;
	replyCount: number;
	repostCount: number;
	likeCount: number;
	indexedAt: string;
	labels: BskyLabel[];
	viewer: {
		like?: string;
		repost?: string;
	};
}

export interface BskyThreadNotFound {
	$type: 'app.bsky.feed.defs#notFoundPost';
	notFound: true;
	uri: string;
}

export interface BskyThreadBlockedPost {
	$type: 'app.bsky.feed.defs#blockedPost';
	blocked: true;
	uri: string;
}

export interface BskyThread {
	$type: 'app.bsky.feed.defs#threadViewPost';
	post: BskyPost;
	parent?: BskyThread | BskyThreadNotFound | BskyThreadBlockedPost;
	replies: Array<BskyThread | BskyThreadBlockedPost>;
}

export interface BskyThreadResponse {
	thread: BskyThread | BskyThreadBlockedPost;
}

export interface BskyTimelinePost {
	post: BskyPost;
	reply?: {
		root: BskyPost;
		parent: BskyPost;
	};
	reason?: { $type: 'app.bsky.feed.defs#reasonRepost'; by: BskyProfileBasic; indexedAt: string };
}

export interface BskyTimelineResponse {
	cursor?: string;
	feed: BskyTimelinePost[];
}

export interface BskyResolvedDidResponse {
	did: DID;
}

export interface BskyFollowersResponse {
	cursor?: string;
	subject: BskyProfileFollow;
	followers: BskyProfileFollow[];
}

export interface BskyFollowsResponse {
	cursor?: string;
	subject: BskyProfileFollow;
	follows: BskyProfileFollow[];
}

export interface BskyCreateRecordResponse {
	uri: string;
	cid: string;
}

export interface BskySearchActorTypeaheadResponse {
	actors: BskyProfileTypeaheadSearch[];
}

export interface BskyGetPostsResponse {
	posts: BskyPost[];
}

export interface BskyLikeRecord {
	$type: 'app.bsky.feed.like';
	subject: {
		cid: string;
		uri: string;
	};
	createdAt: string;
}

export interface BskyRecord<R extends {}> {
	cid: string;
	uri: string;
	value: R;
}

export interface BskyListRecordsResponse<R extends {}> {
	cursor: string;
	records: BskyRecord<R>[];
}

export interface BskyGetInviteCodesResponse {
	codes: Array<{
		code: string;
		available: number;
		disabled: boolean;
		forAccount: string;
		createdBy: string;
		createdAt: string;
		uses: Array<{
			usedBy: string;
			usedAt: string;
		}>;
	}>;
}

export interface BskyFollowRecord {
	$type: 'app.bsky.graph.follow';
	createdAt: string;
	subject: string;
}

export interface BskyRepostRecord {
	$type: 'app.bsky.feed.repost';
	createdAt: string;
	subject: {
		cid: string;
		uri: string;
	};
}

export interface BskyNotification<T extends string, R extends {}> {
	uri: string;
	cid: string;
	isRead: boolean;
	author: BskyProfileBasic;
	reason: T;
	reasonSubject: T extends 'reply' | 'like' ? string : never;
	record: R;
	labels: BskyLabel[];
	indexedAt: string;
}

export type BskyFollowNotification = BskyNotification<'follow', BskyFollowRecord>;
export type BskyLikeNotification = BskyNotification<'like', BskyLikeRecord>;
export type BskyQuoteNotification = BskyNotification<'quote', BskyPostRecord>;
export type BskyReplyNotification = BskyNotification<'reply', BskyPostRecord>;
export type BskyRepostNotification = BskyNotification<'repost', BskyRepostRecord>;

export type BskyNotificationType =
	| BskyFollowNotification
	| BskyLikeNotification
	| BskyQuoteNotification
	| BskyReplyNotification
	| BskyRepostNotification;

export interface BskyNotificationsResponse {
	cursor?: string;
	notifications: Array<BskyNotificationType>;
}

export interface BskyGetLikesResponse {
	uri: string;
	cursor?: string;
	likes: Array<{
		createdAt: string;
		indexedAt: string;
		actor: BskyProfileFollow;
	}>;
}

export interface BskyGetRepostedByResponse {
	uri: string;
	cursor?: string;
	repostedBy: BskyProfileFollow[];
}

export interface BskyBlob {
	$type: 'blob';
	mimeType: string;
	ref: {
		$link: string;
	};
	size: number;
}

export interface BskyFeedGenerator {
	uri: string;
	cid: string;
	did?: string;
	creator: BskyProfile;
	displayName: string;
	description?: string;
	descriptionFacets?: Facet[];
	avatar?: string;
	likeCount?: number;
	indexedAt: string;
	viewer?: {
		like?: string;
	};
}

export interface BskyGetFeedGeneratorsResponse {
	feeds: BskyFeedGenerator[];
}

export type BskyListType = 'app.bsky.graph.defs#modlist';

export interface BskyList {
	uri: string;
	creator: BskyProfile;
	name: string;
	purpose: BskyListType;
	description?: string;
	descriptionFacets?: Facet[];
	avatar?: string;
	indexedAt: string;
	viewer?: {
		muted?: boolean;
	};
}

export interface BskyListBasic {
	uri: string;
	name: string;
	purpose: BskyListType;
	avatar?: string;
	indexedAt: string;
	viewer?: {
		muted?: boolean;
	};
}

export interface BskyListSubject {
	subject: BskyProfile;
}

export interface BskyGetListsResponse {
	cursor?: string;
	lists: BskyList[];
}

export interface BskyGetListResponse {
	cursor?: string;
	list: BskyList;
	items: BskyListSubject[];
}
