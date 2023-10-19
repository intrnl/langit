import { createContext } from 'solid-js';

import type { QueryReturn } from '@intrnl/sq';

import type { ListPage } from '~/api/queries/get-list.ts';
import type { Collection } from '~/api/utils.ts';

export const ProfileListContext = createContext<QueryReturn<Collection<ListPage>, string>>();
