interface ExtInfo {
	types: TypeInfo | TypeInfo[]
	type?: 'or' | 'and'
}

interface Markers {
	name: string
	doc: string
	extendsFrom?: ExtInfo
}

interface SlotSumary {
	label: string
	doc?: string
	value?: number | string
	children: SlotSumary[]
}

interface Resource {
	name: string
	url: string
	type: 'image' | 'video' | 'audio' | 'file'
	category?: string
	fileType?: string
}

interface TypeInfo {
	name: string
	doc: string
	extends?: ExtInfo
	note?: { doc: string; type: 'info' | 'warn' | 'alert' | 'default' }
	markers?: Markers[]
	slots: TypeInfo & {
		summary?: SlotSumary
	}
	definition?: { txt: string; loc: string }
	subTypes: TypeInfo[]
	resources?: Resource[]
}
