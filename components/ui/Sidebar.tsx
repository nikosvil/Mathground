'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { calc2Course } from '@/lib/courses/calc2'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col overflow-y-auto border-r border-gray-800 bg-gray-950 py-6">
      <div className="mb-6 px-5">
        <Link href="/" className="text-xl font-bold tracking-tight text-white">
          Mathground
        </Link>
        <p className="mt-1 text-xs text-gray-500">{calc2Course.title}</p>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {calc2Course.units.map((unit) => (
          <div key={unit.id} className="mb-3">
            <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
              {unit.title}
            </p>
            {unit.topics.map((topic) => {
              const href = `/courses/${calc2Course.id}/units/${unit.id}/topics/${topic.id}`
              const active = pathname === href
              return (
                <Link
                  key={topic.id}
                  href={href}
                  className={`block rounded-md px-3 py-1.5 text-sm transition ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {topic.title}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
