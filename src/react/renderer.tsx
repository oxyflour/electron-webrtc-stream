import { useEffect, useRef } from 'react'
import Reconciler from 'react-reconciler'

type Type = string
type Props = Record<string, any>
type Container = Document | Element
type Instance = Element
type TextInstance = Text
type SuspenseInstance = any
type HydratableInstance = any
type PublicInstance = any
type HostContext = any
type UpdatePayload = any
type ChildSet = any
type TimeoutHandle = any
type NoTimeout = any

const reconciler = Reconciler<
		Type,
		Props,
		Container,
		Instance,
		TextInstance,
		SuspenseInstance,
		HydratableInstance,
		PublicInstance,
		HostContext,
		UpdatePayload,
		ChildSet,
		TimeoutHandle,
		NoTimeout>({
	supportsMutation: true,
	clearContainer(container) {
		for (const item of container.childNodes) {
			container.removeChild(item)
		}
	},
	appendChildToContainer(container, child) {
		container.appendChild(child)
	},
	commitMount() {
	},
	removeChildFromContainer(container, child) {
		container.removeChild(child)
	},

	supportsPersistence: false,
	createInstance(type: Type, props: Props, rootContainer: Container, hostContext: HostContext, internalHandle: any): Instance {
		const inst = document.createElement(type)
		if (props.className) {
			inst.className = props.className
		}
		if (props.id) {
			inst.id = props.id
		}
		return inst
	},
	createTextInstance(text: string, rootContainer: Container, hostContext: HostContext, internalHandle: any): TextInstance {
		return document.createTextNode(text)
	},
	appendInitialChild(parentInstance: Instance, child: Instance | TextInstance): void {
		parentInstance.appendChild(child)
	},
	finalizeInitialChildren(instance: Instance, type: Type, props: Props, rootContainer: Container, hostContext: HostContext): boolean {
		return true
	},
	prepareUpdate(instance: Instance, type: Type, oldProps: Props, newProps: Props, rootContainer: Container, hostContext: HostContext): UpdatePayload {
		return true
	},
	shouldSetTextContent(type: Type, props: Props): boolean {
		return false
	},
	getRootHostContext(rootContainer: Container): HostContext {
		return { }
	},
	getChildHostContext(parentHostContext: HostContext, type: Type, rootContainer: Container): HostContext {
		return { }
	},
	getPublicInstance(instance: Instance | TextInstance): PublicInstance {
		return instance
	},
	prepareForCommit(containerInfo: Container): Record<string, any> {
		return { }
	},
	resetAfterCommit(containerInfo: Container): void {
	},
	preparePortalMount(containerInfo: Container): void {
	},
	now(): number {
		return Date.now()
	},
	scheduleTimeout(fn: (...args: unknown[]) => unknown, delay?: number): TimeoutHandle {
		return setTimeout(fn, delay)
	},
	cancelTimeout(id: TimeoutHandle): void {
		clearTimeout(id)
	},
	noTimeout: true,
	isPrimaryRenderer: false,
	supportsHydration: false
})

export default function Renderer({ url, children, ...rest }:
		React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { url: string }) {
	const ref = useRef<HTMLDivElement>(null)
	useEffect(() => {
		const container = ref.current
		if (container) {
			const root = reconciler.createContainer(container, 0, false, null)
			reconciler.updateContainer(children, root, null)
			return () => { reconciler.updateContainer(null, root, null) }
		} else {
			return () => { }
		}
	}, [ref.current])
	return <div ref={ ref } { ...rest } />
}
