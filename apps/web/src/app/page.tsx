export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">AutoGrader Platform</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
          Real-time grading system for student projects
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
          <a
            href="/docs"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200"
          >
            Documentation
          </a>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          Sprint 0 - Day 1: Next.js Setup Complete ✅
        </p>
      </div>
    </div>
  );
}
