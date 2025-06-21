'use client'

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from '@heroui/react'
import {
  HomeIcon,
  TagIcon,
  PuzzlePieceIcon,
  ArrowPathIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'ホーム', icon: HomeIcon },
    { href: '/tags', label: 'タグ検索', icon: TagIcon },
    { href: '/memory', label: '神経衰弱', icon: PuzzlePieceIcon },
    { href: '/random', label: 'ランダム', icon: ArrowPathIcon },
  ]

  return (
    <Navbar
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
      maxWidth="full"
    >
      <NavbarBrand>
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">白</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            白雪巴アーカイブ
          </span>
        </Link>
      </NavbarBrand>

      {/* Desktop Navigation */}
      <NavbarContent className="hidden md:flex gap-4" justify="center">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <NavbarItem key={item.href} isActive={isActive}>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            </NavbarItem>
          )
        })}
      </NavbarContent>

      {/* Mobile Navigation */}
      <NavbarContent className="md:hidden" justify="end">
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="light"
              isIconOnly
            >
              <Bars3Icon className="w-6 h-6" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Navigation menu">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <DropdownItem
                  key={item.href}
                  href={item.href}
                  startContent={<Icon className="w-4 h-4" />}
                >
                  {item.label}
                </DropdownItem>
              )
            })}
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  )
}
