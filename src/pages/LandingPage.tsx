import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { PRICES } from '../config/pricing';

const FEATURES = [
  ['Match score and skill gaps', 'See which of the job’s requirements your resume proves and which it misses, in seconds.'],
  ['ATS formatting check', 'Find tables, columns, images and missing sections that make applicant tracking systems drop you.'],
  ['AI bullet rewrites', 'Get stronger versions of your own bullets that work in the job’s keywords. Nothing invented.'],
  ['Cover letter and interview prep', 'A cover letter for the exact role and the questions you are likely to be asked about your gaps.'],
  ['Tailored resume download', 'Accept the rewrites you like and download an ATS-friendly DOCX for each application.'],
  ['Application tracker', 'Keep every job, score and status in one place, from saved to offer.'],
] as const;

const STEPS = [
  ['Add the job', 'Paste the description, upload it, or import a career-page link.'],
  ['Upload your resume', 'PDF, DOCX or TXT. Save versions and compare them over time.'],
  ['Fix what’s missing', 'Follow the gap list and rewrites, then re-scan to watch your score climb.'],
] as const;

const FAQ = [
  ['Do you store my resume?', 'Only if you save it or run a comparison, and you can delete any comparison, saved resume or your whole account at any time. Comparisons are removed automatically after a year.'],
  ['Is my resume used to train AI models?', 'No. Text is sent to our AI provider only to produce your results, under API terms that do not allow training on your data.'],
  ['Why not just use ChatGPT?', 'You can. This tool gives you a repeatable score, an ATS check, tracking over time and a tailored download without writing prompts.'],
  ['Can I cancel anytime?', 'Yes. Cancel from the billing page and you keep Pro until the end of the period you paid for.'],
] as const;

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const cta = isAuthenticated ? '/app' : '/signup';

  return (
    <div>
      <section className="bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Find out why your resume isn’t getting interviews
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
            Compare your resume to any job description. See your match score, the skills you’re missing and what applicant
            tracking systems can’t read, then fix it with AI.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={cta} className="btn-primary inline-flex items-center px-8 text-base">
              {isAuthenticated ? 'Open the app' : 'Scan my resume free'}
            </Link>
            <Link to="/pricing" className="btn-secondary inline-flex items-center px-8 text-base">
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">3 free scans every month. No credit card.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-center text-2xl font-bold text-gray-900">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="rounded-xl bg-white p-6 shadow-md">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-gray-900">Everything for each application</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([title, body]) => (
              <li key={title} className="rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-600">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Simple pricing</h2>
        <p className="mt-3 text-gray-600">
          Free to try. Pro is ${PRICES.pro_monthly.amount}/month, or ${PRICES.pass.amount} once for a 90-day Job Hunt Pass.
        </p>
        <Link to="/pricing" className="btn-secondary mt-6 inline-flex items-center">Compare plans</Link>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">Questions</h2>
        <dl className="mt-8 space-y-6">
          {FAQ.map(([q, a]) => (
            <div key={q}>
              <dt className="font-semibold text-gray-900">{q}</dt>
              <dd className="mt-1 text-sm text-gray-600">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
};

export default LandingPage;
