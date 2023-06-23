import {
	type Headers,
	type NewCallOptions,
	ResponseType,
	XRPCError,
	XRPCResponse,
	constructMethodCallHeaders,
	constructMethodCallUri,
	encodeMethodCallBody,
	httpResponseBodyParse,
	httpResponseCodeToEnum,
} from './xrpc-utils.ts';

export interface FetchHandlerResponse {
	status: number;
	headers: Headers;
	body: any;
}

export interface ErrorResponseBody {
	error?: string;
	message?: string;
}

export const isErrorResponse = (value: any, names?: string[]): value is ErrorResponseBody => {
	if (!value) {
		return false;
	}

	const errType = typeof value.error;
	const msgType = typeof value.message;

	return (
		(errType === 'undefined' || errType === 'string') &&
		(msgType === 'undefined' || msgType === 'string') &&
		(!names || names.includes(value.error))
	);
};

export const fetchHandler = async (
	httpUri: string,
	httpMethod: string,
	httpHeaders: Headers,
	httpReqBody: unknown,
	signal?: AbortSignal,
): Promise<FetchHandlerResponse> => {
	try {
		// The duplex field is now required for streaming bodies, but not yet reflected
		// anywhere in docs or types. See whatwg/fetch#1438, nodejs/node#46221.
		const reqInit: RequestInit & { duplex: string } = {
			signal: signal,
			method: httpMethod,
			headers: httpHeaders,
			body: encodeMethodCallBody(httpHeaders, httpReqBody),
			duplex: 'half',
		};

		const res = await fetch(httpUri, reqInit);
		const resBody = await res.arrayBuffer();

		return {
			status: res.status,
			headers: Object.fromEntries(res.headers.entries()),
			body: httpResponseBodyParse(res.headers.get('content-type'), resBody),
		};
	} catch (e) {
		throw new XRPCError(ResponseType.Unknown, String(e));
	}
};

export class XRPC {
	public service: URL;
	public headers: Headers = {};
	public fetch = fetchHandler;

	constructor(serviceUri: string | URL) {
		this.service = serviceUri instanceof URL ? serviceUri : new URL(serviceUri);
	}

	public get<T = any>(options: Omit<NewCallOptions, 'type'>) {
		return this.call<T>({ type: 'get', ...options });
	}

	public post<T = any>(options: Omit<NewCallOptions, 'type'>) {
		return this.call<T>({ type: 'post', ...options });
	}

	public async call<T = any>(options: NewCallOptions) {
		const { type, method, params, data, encoding, headers, signal } = options;

		const httpUri = constructMethodCallUri(method, this.service, params);
		const httpHeaders = constructMethodCallHeaders(type, data, {
			encoding: encoding,
			headers: {
				...this.headers,
				...headers,
			},
		});

		const res = await this.fetch(httpUri, type, httpHeaders, data, signal);

		const resCode = httpResponseCodeToEnum(res.status);

		if (resCode === ResponseType.Success) {
			return new XRPCResponse<T>(res.body, res.headers);
		} else {
			if (res.body && isErrorResponse(res.body)) {
				throw new XRPCError(resCode, res.body.error, res.body.message);
			} else {
				throw new XRPCError(resCode);
			}
		}
	}
}
