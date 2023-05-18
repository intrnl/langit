import { type DID } from './utils';

import { type Signal } from '~/utils/signals';

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
	viewer: {
		muted: boolean;
		blockedBy: boolean;
		following?: string;
	};
	labels: BskyLabel[];
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
	/**
	 * Timeline API provides context to replies in full details, which means that
	 * we can see the same signal being updated multiple times in the course of a
	 * single timeline query, this property allows preventing those needless
	 * updates from happening.
	 */
	$key?: number;

	uri: string;
	cid: string;
	author: BskyProfileBasic;
	record: {
		$type: 'app.bsky.feed.post';
		text: string;
		facets: any[];
		createdAt: string;
		reply?: {
			root: {
				cid: string;
				uri: string;
			};
			parent: {
				cid: string;
				uri: string;
			};
		};
		embed?: BskyPostRecordEmbed;
	};
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

export interface SignalizedLinearThread {
	post: Signal<BskyPost>;
	ancestors: Signal<BskyPost>[];
	descendants: Signal<BskyPost>[];
}

export interface BskyTimelinePost {
	post: BskyPost;
	reply?: {
		root: BskyPost;
		parent: BskyPost;
	};
	reason?: { $type: 'app.bsky.feed.defs#reasonRepost'; by: BskyProfileBasic; indexedAt: string };
}

export interface SignalizedTimelinePost extends Omit<BskyTimelinePost, 'post' | 'reply'> {
	post: Signal<BskyPost>;
	reply?: {
		root: Signal<BskyPost>;
		parent: Signal<BskyPost>;
	};
}

export interface BskyTimelineResponse {
	cursor?: string;
	feed: BskyTimelinePost[];
}

export interface BskyResolvedDidResponse {
	did: DID;
}
