import { useState } from 'react'
import ReactDOM from 'react-dom'
import Receiver from './react/receiver'
import Sender from './react/sender'

document.body.style.margin = document.body.style.padding = '0'

function App() {
	const [count, setCount] = useState(0)
	return <div>
		<button onClick={ () => setCount(count + 1) }>Add</button> { count }
	</div>
}

const url = new URL(location.href),
	{ searchParams } = url,
	root = document.getElementById('root')
if (searchParams.get('recv')) {
	ReactDOM.render(<Receiver
		style={{ width: '100%', height: '100%' }}
		channel={ searchParams.get('recv') }>
	</Receiver>, root)
} else if (searchParams.get('send')) {
	ReactDOM.render(<Sender
		channel={ searchParams.get('send') }>
		<App />
	</Sender>, root)
} else {
	searchParams.set('recv', Math.random().toString(16).slice(2, 10))
	location.href = url.toString()
}
