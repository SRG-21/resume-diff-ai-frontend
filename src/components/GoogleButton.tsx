import React, { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

type GoogleId = {
  initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
};

const loadScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as unknown as { google?: unknown }).google) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    const script = (existing as HTMLScriptElement) || document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Could not load Google sign-in')));
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

interface GoogleButtonProps {
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

/** "Continue with Google" using Google Identity Services. Renders nothing when no client id is configured. */
export const GoogleButton: React.FC<GoogleButtonProps> = ({ onCredential, text = 'continue_with' }) => {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !container.current) return;
        const google = (window as unknown as { google: { accounts: { id: GoogleId } } }).google;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        });
        google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text,
          width: Math.min(360, container.current.offsetWidth || 360),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [onCredential, text]);

  if (!CLIENT_ID || failed) return null;

  return (
    <div>
      <div ref={container} className="flex justify-center" data-testid="google-button" />
      <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
};
