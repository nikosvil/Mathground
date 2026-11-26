import Link from 'next/link'
import { calc2Course } from '@/lib/courses/calc2'

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-12 text-center">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Welcome to <span className="text-blue-400">Mathground</span>
        </h1>
        <p className="mt-3 text-lg text-gray-400">
          Interactive visualizations and AI tutoring for {calc2Course.title}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {calc2Course.units.map((unit) => (
          <Link
            key={unit.id}
            href={`/courses/${calc2Course.id}/units/${unit.id}/topics/${unit.topics[0].id}`}
            className="group rounded-xl border border-gray-800 bg-gray-900 p-6 text-left transition hover:border-blue-700 hover:bg-gray-800"
          >
            <h2 className="font-semibold text-white group-hover:text-blue-400">{unit.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{unit.topics.length} topics</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
