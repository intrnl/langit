import fs from 'node:fs';
import path from 'node:path';

import globToRegex from 'glob-to-regexp';

import { type ConfigRoute, type RouteManifest, normalizeSlashes } from '../utils';
import { findConfig } from './config';
import {
	escapeEnd,
	escapeStart,
	isSegmentSeparator,
	optionalEnd,
	optionalStart,
	paramPrefixChar,
	routeModuleExts,
} from './routesConvention';

const PrefixLookupTrieEndSymbol = Symbol('PrefixLookupTrieEndSymbol');
type PrefixLookupNode = {
	[key: string]: PrefixLookupNode;
} & Record<typeof PrefixLookupTrieEndSymbol, boolean>;

class PrefixLookupTrie {
	root: PrefixLookupNode = {
		[PrefixLookupTrieEndSymbol]: false,
	};

	add(value: string) {
		if (!value) {
			throw new Error('Cannot add empty string to PrefixLookupTrie');
		}

		let node = this.root;
		for (let char of value) {
			if (!node[char]) {
				node[char] = {
					[PrefixLookupTrieEndSymbol]: false,
				};
			}
			node = node[char];
		}
		node[PrefixLookupTrieEndSymbol] = true;
	}

	findAndRemove(prefix: string, filter: (nodeValue: string) => boolean): string[] {
		let node = this.root;
		for (let char of prefix) {
			if (!node[char]) {
				return [];
			}
			node = node[char];
		}

		return this._findAndRemoveRecursive([], node, prefix, filter);
	}

	_findAndRemoveRecursive(
		values: string[],
		node: PrefixLookupNode,
		prefix: string,
		filter: (nodeValue: string) => boolean,
	): string[] {
		for (let char of Object.keys(node)) {
			this._findAndRemoveRecursive(values, node[char], prefix + char, filter);
		}

		if (node[PrefixLookupTrieEndSymbol] && filter(prefix)) {
			node[PrefixLookupTrieEndSymbol] = false;
			values.push(prefix);
		}

		return values;
	}
}

const collator = new Intl.Collator('en-US');

export const flatRoutes = (routesDir: string, ignoredFilePatterns: string[] = []) => {
	const ignoredFileRegex = ignoredFilePatterns.map((pattern) => {
		return globToRegex(pattern);
	});

	// Only read the routes directory
	const entries = fs.readdirSync(routesDir, {
		withFileTypes: true,
		encoding: 'utf-8',
	});

	const routes: string[] = [];
	for (const entry of entries) {
		const filepath = path.join(routesDir, entry.name);

		let route: string | null = null;

		// If it's a directory, don't recurse into it, instead just look for a route module
		if (entry.isDirectory()) {
			route = findRouteModuleForFolder(routesDir, filepath, ignoredFileRegex);
		} else if (entry.isFile()) {
			route = findRouteModuleForFile(routesDir, filepath, ignoredFileRegex);
		}

		if (route) {
			routes.push(route);
		}
	}

	routes.sort((a, b) => collator.compare(a, b));

	const routeManifest = flatRoutesUniversal(routesDir, routes);
	return routeManifest;
};

export function flatRoutesUniversal(dirname: string, routes: string[]): RouteManifest {
	const normalizedDirname = normalizeSlashes(dirname);

	const urlConflicts = new Map<string, ConfigRoute[]>();
	const routeManifest: RouteManifest = {};
	const prefixLookup = new PrefixLookupTrie();
	const uniqueRoutes = new Map<string, ConfigRoute>();
	const routeIdConflicts = new Map<string, string[]>();

	// id -> file
	const routeIds = new Map<string, string>();

	for (const file of routes) {
		const normalizedFile = normalizeSlashes(file);
		const routeExt = path.extname(normalizedFile);
		const routeDir = path.dirname(normalizedFile);

		const routeId =
			routeDir === normalizedDirname
				? path.posix.relative(normalizedDirname, normalizedFile).slice(0, -routeExt.length)
				: path.posix.relative(normalizedDirname, routeDir);

		const conflict = routeIds.get(routeId);

		if (conflict) {
			let currentConflicts = routeIdConflicts.get(routeId);

			if (!currentConflicts) {
				currentConflicts = [path.posix.relative(normalizedDirname, conflict)];
			}

			currentConflicts.push(path.posix.relative(normalizedDirname, normalizedFile));
			routeIdConflicts.set(routeId, currentConflicts);

			continue;
		}

		routeIds.set(routeId, normalizedFile);
	}

	const sortedRouteIds = Array.from(routeIds).sort(([a], [b]) => b.length - a.length);

	for (const [routeId, file] of sortedRouteIds) {
		const index = routeId.endsWith('_index');
		const [segments, raw] = getRouteSegments(routeId);
		const pathname = createRoutePath(segments, raw, index);

		routeManifest[routeId] = {
			file: file.slice(dirname.length + 1),
			id: routeId,
			path: pathname,
		};

		if (index) {
			routeManifest[routeId].index = true;
		}

		const childRouteIds = prefixLookup.findAndRemove(routeId, (value) => {
			return ['.', '/'].includes(value.slice(routeId.length).charAt(0));
		});

		prefixLookup.add(routeId);

		if (childRouteIds.length > 0) {
			for (const childRouteId of childRouteIds) {
				routeManifest[childRouteId].parentId = routeId;
			}
		}
	}

	// path creation
	const parentChildrenMap = new Map<string, ConfigRoute[]>();

	for (const [routeId] of sortedRouteIds) {
		const config = routeManifest[routeId];
		if (!config.parentId) {
			continue;
		}
		const existingChildren = parentChildrenMap.get(config.parentId) || [];
		existingChildren.push(config);
		parentChildrenMap.set(config.parentId, existingChildren);
	}

	for (const [routeId] of sortedRouteIds) {
		const config = routeManifest[routeId];
		const originalPathname = config.path || '';
		const parentConfig = config.parentId ? routeManifest[config.parentId] : null;

		let pathname = config.path;

		if (parentConfig?.path && pathname) {
			pathname = pathname.slice(parentConfig.path.length).replace(/^\//, '').replace(/\/$/, '');
		}

		const conflictRouteId = originalPathname + (config.index ? '?index' : '');
		const conflict = uniqueRoutes.get(conflictRouteId);

		if (!config.parentId) {
			config.parentId = undefined;
		}

		config.path = pathname || undefined;
		uniqueRoutes.set(conflictRouteId, config);

		if (conflict && (originalPathname || config.index)) {
			let currentConflicts = urlConflicts.get(originalPathname);
			if (!currentConflicts) {
				currentConflicts = [conflict];
			}
			currentConflicts.push(config);
			urlConflicts.set(originalPathname, currentConflicts);
			continue;
		}
	}

	if (routeIdConflicts.size > 0) {
		for (const [routeId, files] of routeIdConflicts.entries()) {
			console.error(getRouteIdConflictErrorMessage(routeId, files));
		}
	}

	// report conflicts
	if (urlConflicts.size > 0) {
		for (const [path, routes] of urlConflicts.entries()) {
			// delete all but the first route from the manifest
			for (let i = 1; i < routes.length; i++) {
				delete routeManifest[routes[i].id];
			}

			const files = routes.map((r) => r.file);
			console.error(getRoutePathConflictErrorMessage(path, files));
		}
	}

	return routeManifest;
}

const findRouteModuleForFile = (
	dirname: string,
	filename: string,
	ignoredFileRegex: RegExp[],
): string | null => {
	const relativePath = path.relative(dirname, filename);
	const isIgnored = ignoredFileRegex.some((regex) => regex.test(relativePath));

	if (isIgnored) {
		return null;
	}

	return filename;
};

const findRouteModuleForFolder = (
	dirname: string,
	filename: string,
	ignoredFileRegex: RegExp[],
): string | null => {
	const relativePath = path.relative(dirname, filename);
	const isIgnored = ignoredFileRegex.some((regex) => regex.test(relativePath));

	if (isIgnored) {
		return null;
	}

	const routeRouteModule = findConfig(filename, 'route', routeModuleExts);
	const routeIndexModule = findConfig(filename, 'index', routeModuleExts);

	// if both a route and index module exist, throw a conflict error
	// preferring the route module over the index module
	if (routeRouteModule && routeIndexModule) {
		const [segments, raw] = getRouteSegments(path.relative(dirname, filename));
		const routePath = createRoutePath(segments, raw, false);

		console.error(getRoutePathConflictErrorMessage(routePath || '/', [routeRouteModule, routeIndexModule]));
	}

	return routeRouteModule || routeIndexModule || null;
};

type State =
	| // normal path segment normal character concatenation until we hit a special character or the end of the segment (i.e. `/`, `.`, '\')
	'NORMAL'
	// we hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks
	| 'ESCAPE'
	// we hit a `(` and are now in an optional segment until we hit a `)` or an escape sequence
	| 'OPTIONAL'
	// we previously were in a opt fional segment and hit a `[` and are now in an escape sequence until we hit a `]` - take characters literally and skip isSegmentSeparator checks - afterwards go back to OPTIONAL state
	| 'OPTIONAL_ESCAPE';

export const getRouteSegments = (routeId: string): [string[], string[]] => {
	const routeSegments: string[] = [];
	const rawRouteSegments: string[] = [];

	let index = 0;
	let routeSegment = '';
	let rawRouteSegment = '';
	let state: State = 'NORMAL';

	const pushRouteSegment = (segment: string, rawSegment: string) => {
		if (!segment) {
			return;
		}

		const notSupportedInRR = (segment: string, char: string) => {
			throw new Error(`Route segment "${segment}" for "${routeId}" cannot contain "${char}"`);
		};

		if (rawSegment.includes('*')) {
			return notSupportedInRR(rawSegment, '*');
		}

		if (rawSegment.includes(':')) {
			return notSupportedInRR(rawSegment, ':');
		}

		if (rawSegment.includes('/')) {
			return notSupportedInRR(segment, '/');
		}

		routeSegments.push(segment);
		rawRouteSegments.push(rawSegment);
	};

	while (index < routeId.length) {
		const char = routeId[index];
		index++; // advance to next char

		switch (state) {
			case 'NORMAL': {
				if (isSegmentSeparator(char)) {
					pushRouteSegment(routeSegment, rawRouteSegment);
					routeSegment = '';
					rawRouteSegment = '';
					state = 'NORMAL';
					break;
				}
				if (char === escapeStart) {
					state = 'ESCAPE';
					rawRouteSegment += char;
					break;
				}
				if (char === optionalStart) {
					state = 'OPTIONAL';
					rawRouteSegment += char;
					break;
				}
				if (!routeSegment && char == paramPrefixChar) {
					if (index === routeId.length) {
						routeSegment += '*';
						rawRouteSegment += char;
					} else {
						routeSegment += ':';
						rawRouteSegment += char;
					}
					break;
				}

				routeSegment += char;
				rawRouteSegment += char;
				break;
			}
			case 'ESCAPE': {
				if (char === escapeEnd) {
					state = 'NORMAL';
					rawRouteSegment += char;
					break;
				}

				routeSegment += char;
				rawRouteSegment += char;
				break;
			}
			case 'OPTIONAL': {
				if (char === optionalEnd) {
					routeSegment += '?';
					rawRouteSegment += char;
					state = 'NORMAL';
					break;
				}

				if (char === escapeStart) {
					state = 'OPTIONAL_ESCAPE';
					rawRouteSegment += char;
					break;
				}

				if (!routeSegment && char === paramPrefixChar) {
					if (index === routeId.length) {
						routeSegment += '*';
						rawRouteSegment += char;
					} else {
						routeSegment += ':';
						rawRouteSegment += char;
					}
					break;
				}

				routeSegment += char;
				rawRouteSegment += char;
				break;
			}
			case 'OPTIONAL_ESCAPE': {
				if (char === escapeEnd) {
					state = 'OPTIONAL';
					rawRouteSegment += char;
					break;
				}

				routeSegment += char;
				rawRouteSegment += char;
				break;
			}
		}
	}

	// process remaining segment
	pushRouteSegment(routeSegment, rawRouteSegment);
	return [routeSegments, rawRouteSegments];
};

export const createRoutePath = (routeSegments: string[], rawRouteSegments: string[], isIndex?: boolean) => {
	let result: string[] = [];

	if (isIndex) {
		routeSegments = routeSegments.slice(0, -1);
	}

	for (let index = 0; index < routeSegments.length; index++) {
		let segment = routeSegments[index];
		let rawSegment = rawRouteSegments[index];

		// skip pathless layout segments
		if (segment.startsWith('_') && rawSegment.startsWith('_')) {
			continue;
		}

		// remove trailing slash
		if (segment.endsWith('_') && rawSegment.endsWith('_')) {
			segment = segment.slice(0, -1);
		}

		result.push(segment);
	}

	return result.length ? result.join('/') : undefined;
};

export const getRoutePathConflictErrorMessage = (pathname: string, routes: string[]) => {
	let [taken, ...others] = routes;

	if (!pathname.startsWith('/')) {
		pathname = '/' + pathname;
	}

	return (
		`⚠️ Route Path Collision: "${pathname}"\n\n` +
		`The following routes all define the same URL, only the first one will be used\n\n` +
		`🟢 ${taken}\n` +
		others.map((route) => `⭕️️ ${route}`).join('\n') +
		'\n'
	);
};

export const getRouteIdConflictErrorMessage = (routeId: string, files: string[]) => {
	let [taken, ...others] = files;

	return (
		`⚠️ Route ID Collision: "${routeId}"\n\n` +
		`The following routes all define the same Route ID, only the first one will be used\n\n` +
		`🟢 ${taken}\n` +
		others.map((route) => `⭕️️ ${route}`).join('\n') +
		'\n'
	);
};
