import fs from 'fs/promises'
import path from 'path'

export async function loadTemplates() {
	const libTemplate = await fs.readFile(
		path.join(process.cwd(), './templates/lib.mdx'),
		{
			encoding: 'utf-8',
		}
	)

	const typeTemplate = await fs.readFile(
		path.join(process.cwd(), './templates/type.mdx'),
		{
			encoding: 'utf-8',
		}
	)

	return [libTemplate, typeTemplate]
}
