import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const serif = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nykaa Fashion — Wishlist Discovery Engine",
  description:
    "A live AI discovery engine for Nykaa Fashion's wishlist→purchase problem. Analyze feedback against a blocker taxonomy and explore the collected corpus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <header className="site-header">
          <div className="container inner">
            <a className="brandmark" href="#top" style={{ textDecoration: "none", color: "var(--ink)" }}>
              <span className="brand-dot" />
              <span>Nykaa Fashion · <span className="serif">Wishlist Discovery</span></span>
            </a>
            <nav className="nav">
              <span className="muted small">Part 1 · Wishlist→Purchase</span>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="container">
            Part 1 · AI-Powered Discovery Engine — discovering the wishlist→purchase blocker for
            Nykaa Fashion, across categories, with no monetary incentives. Percentages come from
            collected user feedback only; external research is shown as labelled context.
          </div>
        </footer>
      </body>
    </html>
  );
}
