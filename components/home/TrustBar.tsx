const TRUST_ITEMS = [
  { icon: '🛡️', title: 'Verified Retailers',  desc: 'Only authorized UAE sellers' },
  { icon: '⚡', title: 'Real-time Prices',     desc: 'Updated every 2 hours' },
  { icon: '🔒', title: 'Secure & Private',     desc: 'Your data is protected' },
  { icon: '🇦🇪', title: 'UAE Based',           desc: 'Serving GCC since 2024' },
]

export function TrustBar() {
  return (
    <section className="py-10 bg-gray-50 border-t border-gray-200 -mx-4 px-4 md:-mx-6 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {TRUST_ITEMS.map(item => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <span className="text-3xl">{item.icon}</span>
              <div className="font-bold text-gray-800">{item.title}</div>
              <div className="text-sm text-gray-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
