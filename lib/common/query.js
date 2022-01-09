/**
 * 
 * @param { string } search 
 */
export function parse(search) {
	return Object.fromEntries(search
		.split('&')
		.map(line => line.split('='))
		.map(([key, val]) => [key, decodeURIComponent(val)]))
}

/**
 * 
 * @param { object } params 
 */
export function join(params) {
	return Object.entries(params)
		.map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
		.join('&')
}

export default { parse, join }
