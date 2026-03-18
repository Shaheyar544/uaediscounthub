export function PriceAlertBanner() {
  return (
    <section className="py-8 px-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-white text-center md:text-left">
          <div className="text-sm font-bold text-blue-200 uppercase tracking-wide mb-1">
            ⚡ Price Drop Alerts
          </div>
          <h3 className="text-2xl font-black">Never Miss a Deal Again</h3>
          <p className="text-blue-200 mt-1 text-sm">
            Get instant WhatsApp & email alerts when prices drop
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <a
            href="https://t.me/UAEDiscountHub"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-blue-600 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            📢 Telegram Alerts
          </a>
          <a
            href="#newsletter"
            className="flex items-center gap-2 bg-blue-500 text-white font-bold px-5 py-3 rounded-xl border border-blue-400 hover:bg-blue-400 transition-colors whitespace-nowrap"
          >
            📧 Email Alerts
          </a>
        </div>
      </div>
    </section>
  )
}
