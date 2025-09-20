import env from 'utils/env.util'

/**
 * Make a request to Discogs API
 * @returns Response
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export default async function request<T>({
    url,
    params = {},
    ...options
}: {
    /** Url */
    url: string
    /** Search params to add to the URL */
    params?: Record<string, string | number | boolean>
} & RequestInit): Promise<{
    /** Data */
    data: T
    /** Status */
    status: number
    /** StatusText */
    statusText: string
}> {
    const fullUrl = new URL(url, 'https://api.discogs.com/')

    if (env.DISCOGS_API_KEY) {
        fullUrl.searchParams.set('token', env.DISCOGS_API_KEY)
    }

    Object.entries(params).forEach(([key, value]) => {
        fullUrl.searchParams.set(key, value.toString())
    })

    const response = await globalThis.fetch(fullUrl.toString(), {
        ...options,
        headers: {
            'User-Agent': 'discogs-notification-on-new-items',
            // eslint-disable-next-line @typescript-eslint/no-misused-spread
            ...(options.headers ?? {}),
        },
    })

    return {
        data: (await response.json()) as T,
        status: response.status,
        statusText: response.statusText,
    }
}
