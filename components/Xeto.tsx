import React from 'react'

export const Xeto = ({ children }) => {
	return (
		<div
			className="nextra-code-block nx-relative nx-mt-6 first:nx-mt-0"
			dangerouslySetInnerHTML={{ __html: children }}
		></div>
	)
}
