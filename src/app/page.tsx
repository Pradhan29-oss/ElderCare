import Link from "next/link";

const services = [
  { title: "Wellness visits", desc: "A trained companion checks in, in person, on your schedule." },
  { title: "Hospital companion", desc: "Pickup, consultation support, prescriptions, and a summary for you." },
  { title: "Medicine reminders", desc: "Doses tracked and missed-dose alerts sent the moment they happen." },
  { title: "One-tap SOS", desc: "Emergency alerts reach you and the nearest caregiver within seconds." },
];

const plans = [
  { name: "Basic", price: "₹499", period: "/mo", features: ["Weekly wellness call", "Dashboard access"] },
  { name: "Standard", price: "₹1,499", period: "/mo", features: ["Home visits", "Medicine reminders", "Emergency support"], highlight: false },
  { name: "Premium", price: "₹2,999", period: "/mo", features: ["Hospital assistance", "Dedicated care manager", "AI monitoring"], highlight: true },
  { name: "Elite", price: "₹5,999", period: "/mo", features: ["Unlimited support", "Priority emergencies", "Concierge assistance"] },
];

export default function Home() {
  return (
    <div className="flex-1">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto w-full">
        <span className="font-display text-2xl font-semibold text-ink">Setu</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-ink hover:opacity-70 transition">
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-ink text-sand rounded-full hover:bg-[#152f2b] transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-10 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono-data text-xs tracking-widest uppercase text-marigold-deep mb-4">
            Elder care, bridged across distance
          </p>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-ink mb-6">
            Your parents in India.
            <br />
            <span className="italic">Your peace of mind,</span> anywhere.
          </h1>
          <p className="text-base sm:text-lg text-ink/70 max-w-md mb-8 leading-relaxed">
            Setu connects families abroad and across cities with trained caregivers, health
            monitoring, and emergency response for the elders they love — built for India,
            in India&rsquo;s languages.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-marigold text-ink font-semibold rounded-full hover:bg-marigold-deep transition"
            >
              Register your family
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-ink/20 text-ink font-medium rounded-full hover:border-ink/50 transition"
            >
              I&rsquo;m a caregiver
            </Link>
          </div>
        </div>

        {/* Signature: reach rings connecting distant family to elder */}
        <div className="relative h-80 sm:h-96 flex items-center justify-center">
          <svg viewBox="0 0 400 320" className="w-full h-full" role="img" aria-label="A signal reaching from a family member to their elder parent">
            <line x1="70" y1="160" x2="330" y2="160" stroke="var(--border-soft)" strokeWidth="2" strokeDasharray="4 8" />
            {/* Family node, far */}
            <g>
              <circle cx="70" cy="160" r="34" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
              <text x="70" y="166" textAnchor="middle" fontSize="26">🧑‍💻</text>
              <text x="70" y="216" textAnchor="middle" fontSize="12" fill="var(--ink)" fontFamily="var(--font-inter)">Family, abroad</text>
            </g>
            {/* Elder node, near, with pulse rings = live status */}
            <g>
              <circle className="reach-ring" cx="330" cy="160" r="34" fill="none" stroke="var(--sage)" strokeWidth="2" />
              <circle cx="330" cy="160" r="34" fill="var(--card)" stroke="var(--sage)" strokeWidth="2.5" />
              <text x="330" y="166" textAnchor="middle" fontSize="26">👵</text>
              <text x="330" y="216" textAnchor="middle" fontSize="12" fill="var(--ink)" fontFamily="var(--font-inter)">Elder, in India</text>
            </g>
            {/* status chip */}
            <g transform="translate(280,90)">
              <rect x="0" y="0" width="100" height="28" rx="14" fill="var(--sage)" opacity="0.15" />
              <circle cx="14" cy="14" r="4" fill="var(--sage)" />
              <text x="24" y="18" fontSize="11" fill="var(--sage)" fontFamily="var(--font-plex-mono)">All well today</text>
            </g>
          </svg>
        </div>
      </section>

      {/* Services */}
      <section className="bg-sand-deep border-y border-border-soft py-16">
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <h2 className="font-display text-2xl sm:text-3xl text-ink mb-10">What Setu handles for you</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div key={s.title} className="bg-card rounded-2xl p-6 border border-border-soft">
                <h3 className="font-semibold text-ink mb-2">{s.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="font-display text-2xl sm:text-3xl text-ink mb-10">Plans for every family</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 border flex flex-col ${
                p.highlight ? "border-marigold bg-marigold/10" : "border-border-soft bg-card"
              }`}
            >
              <h3 className="font-semibold text-ink mb-1">{p.name}</h3>
              <p className="font-display text-3xl text-ink mb-4">
                {p.price}
                <span className="text-sm font-sans text-ink/50">{p.period}</span>
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-ink/70 flex gap-2">
                    <span className="text-sage">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="text-center px-4 py-2 rounded-full text-sm font-medium bg-ink text-sand hover:bg-[#152f2b] transition"
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border-soft py-8 text-center text-sm text-ink/50">
        Setu · Built for families across India and the diaspora · Demo environment
      </footer>
    </div>
  );
}
