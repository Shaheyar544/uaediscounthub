const BASE_CATEGORIES = [
  { name: 'Smartphones', icon: '📱', slug: 'smartphones'  },
  { name: 'Laptops',     icon: '💻', slug: 'laptops'      },
  { name: 'Gaming',      icon: '🎮', slug: 'gaming'       },
  { name: 'TV & Audio',  icon: '📺', slug: 'tv-audio'     },
  { name: 'Tablets',     icon: '📟', slug: 'tablets'      },
  { name: 'Wearables',   icon: '⌚', slug: 'wearables'    },
  { name: 'Cameras',     icon: '📷', slug: 'cameras'      },
  { name: 'Appliances',  icon: '🏠', slug: 'appliances'   },
]

interface CategoryBrowsingProps {
  locale: string
  counts?: Record<string, number>  // slug → count from DB
}

export function CategoryBrowsing({ locale, counts = {} }: CategoryBrowsingProps) {
  return (
    <section className="py-10 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-black text-gray-900 mb-6">Shop by Category</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {BASE_CATEGORIES.map(cat => {
            const count = counts[cat.slug] ?? counts[cat.name.toLowerCase()] ?? 0
            return (
              <a
                key={cat.slug}
                href={`/${locale}/categories/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 md:p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all hover:-translate-y-1 group cursor-pointer"
              >
                <span className="text-2xl md:text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>
                <span className="text-[10px] md:text-xs font-bold text-gray-700 text-center group-hover:text-blue-600 transition-colors leading-tight">
                  {cat.name}
                </span>
                {count > 0 && (
                  <span className="text-[9px] md:text-[10px] text-gray-400 hidden md:block">
                    {count}+ deals
                  </span>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
