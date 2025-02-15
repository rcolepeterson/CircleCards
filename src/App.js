import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { Image, ScrollControls, useScroll, Billboard, Text, Plane } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { generate } from 'random-words'
import { easing, geometry } from 'maath'

extend(geometry)
const inter = import('@pmndrs/assets/fonts/inter_regular.woff')

export const App = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [sidebarContent, setSidebarContent] = useState(null)

  const handleCardClick = (content) => {
    setSidebarContent(content)
    setSidebarVisible(true)
  }

  const handleCloseSidebar = () => {
    setSidebarVisible(false)
    setSidebarContent(null)
  }

  return (
    <>
      <Canvas dpr={[1, 1.5]}>
        <ScrollControls pages={4} infinite>
          <Scene position={[0, 1.5, 0]} onCardClick={handleCardClick} />
        </ScrollControls>
      </Canvas>
      <Sidebar content={sidebarContent} visible={sidebarVisible} onClose={handleCloseSidebar} />
    </>
  )
}

function Scene({ children, onCardClick, ...props }) {
  const ref = useRef()
  const scroll = useScroll()
  const [hovered, hover] = useState(null)
  const [hoveredText, setHoveredText] = useState(null)
  useFrame((state, delta) => {
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2) // Rotate contents
    state.events.update() // Raycasts every frame rather than on pointer-move
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9], 0.3, delta)
    state.camera.lookAt(0, 0, 0)
  })
  return (
    <group ref={ref} {...props}>
      <Cards
        category="Europa"
        color="blue"
        from={0}
        len={Math.PI / 4}
        onPointerOver={hover}
        onPointerOut={hover}
        setHoveredText={setHoveredText}
        onCardClick={onCardClick}
      />
      <Cards
        category="Africa"
        color="green"
        from={Math.PI / 4}
        len={Math.PI / 2}
        position={[0, 0.4, 0]}
        onPointerOver={hover}
        onPointerOut={hover}
        setHoveredText={setHoveredText}
        onCardClick={onCardClick}
      />
      <Cards
        category="Americas"
        color="red"
        from={Math.PI / 4 + Math.PI / 2}
        len={Math.PI / 2}
        onPointerOver={hover}
        onPointerOut={hover}
        setHoveredText={setHoveredText}
        onCardClick={onCardClick}
      />
      <Cards
        category="Oriente medio"
        color="yellow"
        from={Math.PI * 1.25}
        len={Math.PI * 2 - Math.PI * 1.25}
        position={[0, -0.4, 0]}
        onPointerOver={hover}
        onPointerOut={hover}
        setHoveredText={setHoveredText}
        onCardClick={onCardClick}
      />
      <ActiveCard hovered={hovered} text={hoveredText} />
    </group>
  )
}

function Cards({ category, color, data, from = 0, len = Math.PI * 2, radius = 5.25, onPointerOver, onPointerOut, setHoveredText, onCardClick, ...props }) {
  const [hovered, hover] = useState(null)
  const amount = Math.round(len * 22)
  const textPosition = from + (amount / 2 / amount) * len
  return (
    <group {...props}>
      <Billboard position={[Math.sin(textPosition) * radius * 1.4, 0.5, Math.cos(textPosition) * radius * 1.4]}>
        <Text font={suspend(inter).default} fontSize={0.25} anchorX="center" color="black">
          {category}
        </Text>
      </Billboard>
      {Array.from({ length: amount - 3 /* minus 3 images at the end, creates a gap */ }, (_, i) => {
        const angle = from + (i / amount) * len
        const yOffset = Math.sin(angle) * 0.5 // Adjust y position to create up and down effect
        return (
          <Card
            key={angle}
            color={color}
            onPointerOver={(e) => (e.stopPropagation(), hover(i), onPointerOver(i), setHoveredText(`Text for ${category} ${i}`))}
            onPointerOut={() => (hover(null), onPointerOut(null), setHoveredText(null))}
            onClick={() => onCardClick(`Content for ${category} ${i}`)}
            position={[Math.sin(angle) * radius, yOffset, Math.cos(angle) * radius]}
            rotation={[0, Math.PI / 2 + angle, 0]}
            active={hovered !== null}
            hovered={hovered === i}
            url={`/img${Math.floor(i % 10) + 1}.jpg`}
          />
        )
      })}
    </group>
  )
}

function Card({ url, color, active, hovered, onClick, ...props }) {
  const ref = useRef()
  useFrame((state, delta) => {
    const f = hovered ? 1.4 : active ? 1.25 : 1
    easing.damp3(ref.current.position, [0, hovered ? 0.25 : 0, 0], 0.1, delta)
    easing.damp3(ref.current.scale, [1.618 * f, 1 * f, 1], 0.15, delta)
  })
  return (
    <group {...props} onClick={onClick}>
      <group ref={ref}>
        <Plane position={[-0.75, 0.45, 0.01]} scale={[0.1, 0.1, 1]} rotation={[0, 0, 0]} material-color={color} />
        <Image transparent radius={0.075} url={url} scale={[1.618, 1, 1]} side={THREE.DoubleSide} />
      </group>
    </group>
  )
}

function ActiveCard({ hovered, text, ...props }) {
  const ref = useRef()
  useLayoutEffect(() => void (ref.current.material.zoom = 0.8), [hovered])
  useFrame((state, delta) => {
    easing.damp(ref.current.material, 'zoom', 1, 0.5, delta)
    easing.damp(ref.current.material, 'opacity', hovered !== null, 0.3, delta)
  })
  return (
    <Billboard {...props}>
      <Text font={suspend(inter).default} fontSize={0.5} position={[2.15, 3.85, 0]} anchorX="left" color="black">
        {hovered !== null && text}
      </Text>
      <Image ref={ref} transparent radius={0.3} position={[0, 1.5, 0]} scale={[3.5, 1.618 * 3.5, 0.2, 1]} url={`/img${Math.floor(hovered % 10) + 1}.jpg`} />
    </Billboard>
  )
}

function Sidebar({ content, visible, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: visible ? 0 : '-50vw',
        width: '50vw',
        height: '100vh',
        backgroundColor: 'white',
        zIndex: 1000,
        padding: '20px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.5)',
        transition: 'right 0.3s ease-in-out'
      }}>
      <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6L18 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>{content}</div>
    </div>
  )
}
