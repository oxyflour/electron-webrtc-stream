import Receiver from './react/receiver'
import Sender from './react/sender'

const url = new URL(location.href),
	{ searchParams } = url
export default function Caster(props: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>) {
	if (searchParams.get('recv')) {
		return <Receiver { ...props } channel={ searchParams.get('recv') } />
	} else if (searchParams.get('send')) {
		return <Sender channel={ searchParams.get('send') }>{ props.children }</Sender>
	} else {
		searchParams.set('recv', Math.random().toString(16).slice(2, 10))
		location.href = url.toString()
	}
}
