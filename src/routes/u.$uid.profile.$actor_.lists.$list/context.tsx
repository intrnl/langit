import { createContext } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryReturn } from '@intrnl/sq';

export const ListDidContext = createContext<QueryReturn<DID, unknown>>();
