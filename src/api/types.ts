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
	did: string;
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
		blockedBy: boolean;
		following?: string;
	};
}

export interface BskyProfileBasic {
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

export interface BskyProfileFollow {
	did: string;
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

export interface BskyPostRecordEmbed {
	images: Array<{
		alt: string;
		image: {
			$type: 'blob';
			ref: {
				$link: string;
			};
			mimeType: string;
			size: number;
		};
	}>;
	record: {
		cid: string;
		uri: string;
	};
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
	embed?: BskyPostRecordEmbed;
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

export interface EmbeddedRecord {
	$type: 'app.bsky.embed.record#viewRecord';
	uri: string;
	cid: string;
	author: BskyProfileBasic;
	value: any;
	labels?: BskyLabel[];
	embeds?: Array<BskyPostEmbedLink | BskyPostEmbedImage | BskyPostEmbedRecord | BskyPostEmbedRecordWithMedia>;
	indexedAt?: string;
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
	record: EmbeddedRecord | EmbeddedRecordNotFound | EmbeddedRecordBlocked;
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

export interface BskyThread {
	$type: 'app.bsky.feed.defs#threadViewPost';
	post: BskyPost;
	parent?: BskyThread | BskyThreadNotFound;
	replies: BskyThread[];
}

export interface BskyThreadResponse {
	thread: BskyThread;
}

export interface LinearizedThread {
	post: BskyPost;
	parentNotFound: boolean;
	ancestors: BskyPost[];
	descendants: BskyPost[];
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
