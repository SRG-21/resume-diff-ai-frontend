import React from 'react';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../config/pricing';

export const Footer: React.FC = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6 lg:px-8">
      <p>© {new Date().getFullYear()} Resume Diff AI</p>
      <nav className="flex gap-5" aria-label="Footer">
        <Link to="/pricing" className="hover:text-gray-900">Pricing</Link>
        <Link to="/privacy" className="hover:text-gray-900">Privacy</Link>
        <Link to="/terms" className="hover:text-gray-900">Terms</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-gray-900">Support</a>
      </nav>
    </div>
  </footer>
);
