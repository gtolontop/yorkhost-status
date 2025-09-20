export default function SimpleHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center py-20 px-5 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            All Systems Operational
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            All Yorkhost services are running smoothly. Everything is working as expected.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto mb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Web Hosting</h3>
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm">Operational</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Database</h3>
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm">Operational</span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">API</h3>
            <div className="flex items-center gap-2 text-green-600">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <span className="text-sm">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}