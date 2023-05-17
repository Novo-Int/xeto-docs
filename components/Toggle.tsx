import { Switch } from '@headlessui/react'
import classNames from 'classnames'
import React from 'react'

const colorNames = [
	'slate',
	'gray',
	'zinc',
	'neutral',
	'stone',
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink',
	'rose',
] as const

const activeColorValue = (
	c: (typeof colorNames)[number]
): {
	bg: `bg-${(typeof colorNames)[number]}-600`
	text: `text-${(typeof colorNames)[number]}-600`
} => {
	switch (c) {
		case 'slate':
			return { bg: 'bg-slate-600', text: 'text-slate-600' }
		case 'gray':
			return { bg: 'bg-gray-600', text: 'text-gray-600' }
		case 'zinc':
			return { bg: 'bg-zinc-600', text: 'text-zinc-600' }
		case 'neutral':
			return { bg: 'bg-neutral-600', text: 'text-neutral-600' }
		case 'stone':
			return { bg: 'bg-stone-600', text: 'text-stone-600' }
		case 'red':
			return { bg: 'bg-red-600', text: 'text-red-600' }
		case 'orange':
			return { bg: 'bg-orange-600', text: 'text-orange-600' }
		case 'amber':
			return { bg: 'bg-amber-600', text: 'text-amber-600' }
		case 'yellow':
			return { bg: 'bg-yellow-600', text: 'text-yellow-600' }
		case 'lime':
			return { bg: 'bg-lime-600', text: 'text-lime-600' }
		case 'green':
			return { bg: 'bg-green-600', text: 'text-green-600' }
		case 'emerald':
			return { bg: 'bg-emerald-600', text: 'text-emerald-600' }
		case 'teal':
			return { bg: 'bg-teal-600', text: 'text-teal-600' }
		case 'cyan':
			return { bg: 'bg-cyan-600', text: 'text-cyan-600' }
		case 'sky':
			return { bg: 'bg-sky-600', text: 'text-sky-600' }
		case 'blue':
			return { bg: 'bg-blue-600', text: 'text-blue-600' }
		case 'indigo':
			return { bg: 'bg-indigo-600', text: 'text-indigo-600' }
		case 'violet':
			return { bg: 'bg-violet-600', text: 'text-violet-600' }
		case 'purple':
			return { bg: 'bg-purple-600', text: 'text-purple-600' }
		case 'fuchsia':
			return { bg: 'bg-fuchsia-600', text: 'text-fuchsia-600' }
		case 'pink':
			return { bg: 'bg-pink-600', text: 'text-pink-600' }
		case 'rose':
			return { bg: 'bg-rose-600', text: 'text-rose-600' }
	}
}

export const Toggle = ({
	onChange,
	initialValue = false,
	color = 'blue',
}: {
	initialValue?: boolean
	onChange?: (val: boolean) => void
	color?: (typeof colorNames)[number]
}) => {
	const [enabled, setEnabled] = React.useState(initialValue)

	React.useEffect(() => {
		onChange?.(enabled)
	}, [enabled])

	const { bg: bgColor, text: txtColor } = activeColorValue(color)

	return (
		<Switch
			checked={enabled}
			onChange={setEnabled}
			className={classNames(
				enabled ? bgColor : 'bg-gray-200',
				'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out'
			)}
		>
			<span
				className={classNames(
					enabled ? 'translate-x-5' : 'translate-x-0',
					'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
				)}
			>
				<span
					className={classNames(
						enabled
							? 'opacity-0 duration-100 ease-out'
							: 'opacity-100 duration-200 ease-in',
						'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
					)}
					aria-hidden="true"
				>
					<svg
						className="h-3 w-3 text-gray-400"
						fill="none"
						viewBox="0 0 12 12"
					>
						<path
							d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
							stroke="currentColor"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</span>
				<span
					className={classNames(
						enabled
							? 'opacity-100 duration-200 ease-in'
							: 'opacity-0 duration-100 ease-out',
						'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity'
					)}
					aria-hidden="true"
				>
					<svg
						className={`h-3 w-3 ${txtColor}`}
						fill="currentColor"
						viewBox="0 0 12 12"
					>
						<path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
					</svg>
				</span>
			</span>
		</Switch>
	)
}
