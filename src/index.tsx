import Receiver, { HtmlVideoProps } from './react/receiver'
import Sender from './react/sender'

const url = new URL(location.href),
	{ searchParams } = url
export default function Caster(props: HtmlVideoProps & { href?: string, peerOpts?: RTCConfiguration }) {
	if (searchParams.get('send')) {
		return <Sender channel={ searchParams.get('send') } peerOpts={ props.peerOpts }>{ props.children }</Sender>
	} else if (searchParams.get('recv')) {
		return <Receiver channel={ searchParams.get('recv') } { ...props } />
	} else {
		searchParams.set('recv', Math.random().toString(16).slice(2, 10))
		location.href = url.toString()
	}
}
