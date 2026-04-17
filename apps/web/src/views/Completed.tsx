export default function Completed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="text-5xl">✅</div>
      <h1 className="text-2xl font-bold text-gray-900">Session completed</h1>
      <p className="text-gray-500 max-w-md">
        This session has already been completed and its links are no longer active. Start a new
        session to study another article.
      </p>
      <a
        href="/"
        className="mt-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        Study a new article →
      </a>
    </div>
  );
}
