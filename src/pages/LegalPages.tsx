import React from 'react';
import { SUPPORT_EMAIL } from '../config/pricing';

const COMPANY = (import.meta.env.VITE_COMPANY_NAME as string | undefined) || 'Resume Diff AI';
const UPDATED = '2026-10-24';

const Page: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <article className="mx-auto max-w-3xl px-4 py-12 text-gray-700">
    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
    <p className="mt-1 text-sm text-gray-500">Last updated {UPDATED}</p>
    <div className="mt-8 space-y-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
      {children}
    </div>
  </article>
);

export const PrivacyPage: React.FC = () => (
  <Page title="Privacy Policy">
    <p>
      This policy explains what {COMPANY} (“we”) collects when you use the service, why, and the choices you have.
      Questions: <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </p>

    <h2>What we collect</h2>
    <ul>
      <li><strong>Account data:</strong> name, email address, and a hashed password (or your Google account identifier if you sign in with Google).</li>
      <li><strong>Documents you provide:</strong> resumes and job descriptions you upload, paste or import, and the text extracted from them.</li>
      <li><strong>Results:</strong> scores, skill lists, AI-generated rewrites, cover letters and interview questions for your comparisons, and applications you add to the tracker.</li>
      <li><strong>Usage data:</strong> counts of scans and AI actions for plan limits, and basic server logs.</li>
      <li><strong>Billing data:</strong> handled by Stripe. We store your Stripe customer ID and plan status, never your card number.</li>
    </ul>

    <h2>How we use it</h2>
    <ul>
      <li>To compare your resume with a job description and generate the features you request.</li>
      <li>To keep your history and saved resumes so you can come back to them.</li>
      <li>To run billing, prevent abuse, and secure accounts.</li>
      <li>We do not sell your data and we do not use your resume for advertising.</li>
    </ul>

    <h2>Service providers</h2>
    <p>
      To run the service we send data to: OpenAI (resume and job description text, to generate results), Stripe (payments),
      Amazon Web Services (hosting and email) and MongoDB Atlas (database). Our AI provider processes text under API terms
      that do not permit using it to train models.
    </p>

    <h2>Retention and deletion</h2>
    <ul>
      <li>Saved comparisons are deleted automatically one year after they are created.</li>
      <li>You can delete any comparison, saved resume or tracked application at any time, or clear your whole history.</li>
      <li>You can delete your account from the Billing page. This permanently removes your profile, resumes, comparisons and applications and cancels active subscriptions.</li>
      <li>We keep invoices and payment records as long as the law requires.</li>
    </ul>

    <h2>Your rights</h2>
    <p>
      Depending on where you live, you may have the right to access, correct, export or delete your personal data, and to
      object to or restrict certain processing. Email us and we will respond within 30 days.
    </p>

    <h2>Security</h2>
    <p>
      Data is encrypted in transit. Passwords are hashed with bcrypt. Access to production data is limited to the people who
      operate the service. No system is perfectly secure; tell us right away if you suspect a problem.
    </p>

    <h2>Cookies and analytics</h2>
    <p>
      We store your sign-in session in your browser’s local storage. If analytics are enabled we use a cookie-free,
      privacy-friendly tool that does not track you across sites.
    </p>

    <h2>Changes</h2>
    <p>We will post updates here and, for material changes, notify you by email.</p>
  </Page>
);

export const TermsPage: React.FC = () => (
  <Page title="Terms of Service">
    <p>
      By creating an account or using {COMPANY} you agree to these terms. If you do not agree, do not use the service.
    </p>

    <h2>The service</h2>
    <p>
      {COMPANY} compares resumes with job descriptions and provides AI-generated suggestions. Results are estimates to help
      you improve your application. We do not guarantee interviews, job offers, or that any applicant tracking system will
      rank your resume in a particular way.
    </p>

    <h2>Your content</h2>
    <ul>
      <li>You own your resumes and job descriptions. You give us permission to process them to provide the service.</li>
      <li>Only upload content you have the right to use. Do not upload other people’s resumes without their permission.</li>
      <li>AI suggestions can be wrong. Check every suggestion and make sure your final resume is truthful.</li>
    </ul>

    <h2>Acceptable use</h2>
    <ul>
      <li>No automated scraping, reselling of access, or attempts to bypass plan limits.</li>
      <li>No unlawful, harmful or abusive content, and no attempts to disrupt or probe the service.</li>
    </ul>

    <h2>Plans, billing and cancellation</h2>
    <ul>
      <li>Free plans have monthly limits that reset on the first day of each month (UTC).</li>
      <li>Pro and Coach subscriptions renew automatically each month or year until cancelled. Cancel any time from the Billing page; access continues until the end of the paid period.</li>
      <li>The Job Hunt Pass is a one-time payment for 90 days of Pro features. It does not renew.</li>
      <li>Payments are processed by Stripe. Prices may change with notice before your next renewal.</li>
      <li>Refunds: if you are not satisfied, contact us within 14 days of a purchase and we will refund it if you have used fewer than 10 scans in that period. Nothing in these terms limits rights you have under consumer law.</li>
    </ul>

    <h2>Account termination</h2>
    <p>
      You can delete your account at any time. We may suspend accounts that break these terms. We may change or discontinue
      features, and will give notice where reasonable.
    </p>

    <h2>Disclaimers and liability</h2>
    <p>
      The service is provided “as is”. To the extent allowed by law we are not liable for indirect or consequential losses,
      and our total liability is limited to the amount you paid us in the 12 months before the claim.
    </p>

    <h2>Contact</h2>
    <p>
      <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
    </p>
  </Page>
);
