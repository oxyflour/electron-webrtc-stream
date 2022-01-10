import { useState } from "react"
import ReactDOM from 'react-dom'
import Caster from "../src"

function App() {
	const [count, setCount] = useState(0)
	return <div>
		<button onClick={ () => setCount(count + 1) }>Add</button> { count }
	</div>
}

document.body.style.margin = document.body.style.padding = '0'
ReactDOM.render(<Caster style={{ width: '100%', height: '100%' }}>
	<App />
</Caster>, document.getElementById('root'))
