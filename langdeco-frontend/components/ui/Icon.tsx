import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function Menu(props: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
      <line x1="3" y1="7" x2="19" y2="7"/>
      <line x1="3" y1="11" x2="19" y2="11"/>
      <line x1="3" y1="15" x2="14" y2="15"/>
    </svg>
  )
}

export function Cart(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
      <path d="M3 4h14l-1.5 8H4.5L3 4z"/>
      <circle cx="7.5" cy="16.5" r="1"/>
      <circle cx="13.5" cy="16.5" r="1"/>
    </svg>
  )
}

export function Search(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
      <circle cx="8" cy="8" r="5"/>
      <line x1="12" y1="12" x2="16" y2="16"/>
    </svg>
  )
}

export function Arrow(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M3 8h10M9 4l4 4-4 4"/>
    </svg>
  )
}

export function ArrowDown(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <path d="M8 3v10M4 9l4 4 4-4"/>
    </svg>
  )
}

export function Plus(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <line x1="7" y1="2" x2="7" y2="12"/>
      <line x1="2" y1="7" x2="12" y2="7"/>
    </svg>
  )
}

export function Minus(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" {...props}>
      <line x1="2" y1="7" x2="12" y2="7"/>
    </svg>
  )
}

export function Close(props: IconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
      <line x1="3" y1="3" x2="15" y2="15"/>
      <line x1="15" y1="3" x2="3" y2="15"/>
    </svg>
  )
}

export function Whatsapp(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M8 1a7 7 0 0 0-6.07 10.47L1 15l3.65-.95A7 7 0 1 0 8 1zm0 12.6a5.6 5.6 0 0 1-2.85-.78l-.2-.12-2.17.57.58-2.1-.14-.22A5.6 5.6 0 1 1 8 13.6zm3.07-4.19c-.17-.08-1-.49-1.15-.55-.16-.06-.27-.08-.38.08s-.44.55-.54.66c-.1.11-.2.12-.37.04-.17-.08-.72-.27-1.37-.85-.51-.45-.85-1-.95-1.17-.1-.17-.01-.26.07-.34l.33-.38c.1-.12.14-.2.2-.33.07-.13.04-.25-.02-.34-.06-.08-.38-.9-.52-1.24-.14-.33-.28-.28-.38-.29h-.33c-.11 0-.3.04-.46.21-.16.17-.6.59-.6 1.44s.62 1.67.7 1.79c.09.12 1.22 1.87 2.96 2.62.41.18.73.28.98.36.41.13.79.11 1.08.07.33-.05 1-.41 1.14-.8.14-.4.14-.74.1-.81-.04-.07-.15-.11-.32-.19z"/>
    </svg>
  )
}

export function Instagram(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  )
}

export function Facebook(props: IconProps) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.514c-1.491 0-1.956.932-1.956 1.889v2.261h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  )
}

export function Trash(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" {...props}>
      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9"/>
    </svg>
  )
}
