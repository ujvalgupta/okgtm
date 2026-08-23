const CTA_MAILTO =
  "mailto:contactujval@gmail.com?subject=Let%27s%20talk%20-%20OkGTM%20Labs";

export function Footer() {
  return (
    <footer className="bg-surface-soft py-20" role="contentinfo">
      <div className="mx-auto max-w-[1280px] px-6">
        {/* Top row: brand + contact */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-[360px]">
            <p className="text-lg font-semibold tracking-tight text-ink">
              OkGTM Labs
            </p>
            <p className="mt-3 text-sm leading-relaxed text-body">
              Built by Ujval Gupta and the OkGTM Labs team.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink">Contact</h3>
            <ul className="flex flex-col gap-2.5" role="list">
              <li>
                <a
                  href={CTA_MAILTO}
                  className="text-sm text-muted-foreground transition-colors hover:text-ink"
                >
                  Book a call
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/ujvalgupta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-ink"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="mailto:contactujval@gmail.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-ink"
                >
                  contactujval@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-16 border-t border-hairline pt-8">
          <p className="text-sm text-muted-soft">
            &copy; {new Date().getFullYear()} OkGTM Labs. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
