import { Card } from '@/components/ui'

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        About
      </h1>
      <Card>
        <Card.Header title="React Boilerplate" subtitle="Production-ready starter kit" />
        <Card.Body>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            This boilerplate pairs with the Django rfh-api backend. It ships with Tailwind CSS,
            Axios with JWT refresh, React Router v6, dark mode, and a clean component/services/hooks
            folder structure — ready to extend.
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
