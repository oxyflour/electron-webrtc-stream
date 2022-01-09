// @ts-check
import React, { useEffect, useRef, useState } from 'react'
import startRecving from '../node/recv'

/**
 * @type { (props: React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement> & { url?: string }) => JSX.Element }
 */
export default ({ url, ...rest }) => {
	const ref = useRef(null),
		[loading, setLoading] = useState(true),
		[error, setError] = useState(null)
	useEffect(() => {
		/**
		 * @type { HTMLCanvasElement }
		 */
		const canvas = ref.current,
		/**
		 * @type { any }
		 */
			proxy = canvas
		if (canvas) {
			const id = proxy.__req_id = Math.random().toString(16).slice(2, 10)
			setLoading(true)
			setError(null)
			const { width, height } = canvas,
				{ href } = location
			startRecving(id, { width, height, href }).then(src => {
				if (proxy.__req_id === id) {
					const video = document.createElement('video')
					video.width = window.innerWidth
					video.height = window.innerHeight
					document.body.appendChild(video)
					video.srcObject = src
					video.controls = true
					setLoading(false)
				}
			}).catch(err => {
				setError(err)
				setLoading(false)
			})
			return () => { proxy.__req_id = '' }
		} else {
			return () => { }
		}
	}, [ref.current])
	return loading ? <div>loading...</div> :
		error ? <div>{ error && error.message || `${error}` }</div> :
		<canvas ref={ ref } />
}
