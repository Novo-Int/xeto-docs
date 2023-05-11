export function getString(key: string, props: Record<string, unknown>): string {
	const val = props[key]

	if (typeof val !== 'string') {
		throw Error(
			`Can't get string, found: '${val}', for key: '${key}' in context: '${props}'`
		)
	}

	return val
}

export function getOptionalString(
	key: string,
	props: Record<string, unknown>
): string | undefined {
	const val = props[key]
	if (!val) {
		return undefined
	}

	if (typeof val !== 'string') {
		throw Error(`Can't get string, found: '${val}', for key: '${key}'`)
	}

	return val
}
