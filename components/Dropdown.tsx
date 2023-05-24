import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import React, { Fragment, useState } from 'react'

interface DropdownProps {
	data: Array<{ label: string; value: string } | string>
	onChange: (value: string) => void
	className?: string
	defaultValue?: string
}

export function Dropdown({ data, defaultValue }: DropdownProps) {
	const itemLabel = (it) => (typeof it === 'string' ? it : it.label)
	const itemValue = (it) => (typeof it === 'string' ? it : it.value)

	const [selected, setSelected] = useState<
		DropdownProps['data'][number] | undefined
	>(
		defaultValue
			? data.find((it) => itemValue(it) === defaultValue)
			: undefined
	)

	return (
		<div className="fixed top-16 w-72">
			<Listbox value={itemValue(selected)} onChange={setSelected}>
				<div className="relative mt-1">
					<Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left focus:outline-none sm:text-sm">
						<span className="block truncate">
							{itemLabel(selected)}
						</span>
						<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
							<ChevronUpDownIcon
								className="h-5 w-5 text-gray-400"
								aria-hidden="true"
							/>
						</span>
					</Listbox.Button>
					<Transition
						as={Fragment}
						leave="transition ease-in duration-100"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
							{data.map((item, personIdx) => (
								<Listbox.Option
									key={personIdx}
									className={({ active }) =>
										`relative cursor-default select-none py-2 pl-10 pr-4 ${
											active
												? 'bg-amber-100 text-amber-900'
												: 'text-gray-900'
										}`
									}
									value={itemValue(item)}
								>
									{({ selected }) => (
										<>
											<span
												className={`block truncate ${
													selected
														? 'font-medium'
														: 'font-normal'
												}`}
											>
												{itemLabel(item)}
											</span>
											{selected ? (
												<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
													<CheckIcon
														className="h-5 w-5"
														aria-hidden="true"
													/>
												</span>
											) : null}
										</>
									)}
								</Listbox.Option>
							))}
						</Listbox.Options>
					</Transition>
				</div>
			</Listbox>
		</div>
	)
}
