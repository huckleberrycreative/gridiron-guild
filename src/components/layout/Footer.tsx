import { Link } from 'react-router-dom';
import { Mail, ExternalLink } from 'lucide-react';
import logo from '@/assets/logo.png';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Men's League Logo" 
                className="h-10 w-auto rounded-lg invert"
              />
              <div>
                <h3 className="font-display text-lg font-bold leading-none">
                  MEN'S LEAGUE
                </h3>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-md">
              Every other fantasy league is living in the Dark Ages. Thankfully for us, 
              we have the Commish, our most benevolent Dictator. LONG MAY HE REIGN!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/standings', label: 'Standings' },
                { href: '/historic-analytics', label: 'Governor Stats' },
                { href: '/recaps', label: 'Weekly Recaps' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:benholcomb35@gmail.com"
                  className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  <Mail size={14} />
                  Commissioner
                </a>
              </li>
              <li>
                <Link
                  to="/constitution"
                  className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-accent transition-colors duration-200"
                >
                  <ExternalLink size={14} />
                  The Constitution
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10">
          <p className="text-center text-sm text-primary-foreground/50">
            © 2026 Men's League. Powered by The Commish.
          </p>
        </div>
      </div>
    </footer>
  );
}
