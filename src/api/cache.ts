// we keep a global cache outside of tanstack-query because these records can be
// returned in multiple places, e.g. you open a post and then one of its replies

// in that one example, we can feed some initial data to tanstack-query so you
// can at least see the reply and its parents while the app tries to get the
// replies for that one

// this is a form of normalized caching

import { type Signal } from '~/utils/signals';

import { type BskyPost, type BskyPostAuthor } from './types';

export const postAuthors: Record<string, WeakRef<Signal<BskyPostAuthor>>> = {};
export const posts: Record<string, WeakRef<Signal<BskyPost>>> = {};
