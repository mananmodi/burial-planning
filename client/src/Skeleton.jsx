import React from 'react';

const Line = ({ w = '100%', h = 14 }) => <span className="sk" style={{ width: w, height: h }} />;

// Placeholder for a public content page: banner + a few text bands.
export function PageSkeleton() {
  return (
    <div className="sk-page" role="status" aria-busy="true" aria-label="Loading page">
      <div className="sk sk-hero" />
      {[0, 1, 2].map((i) => (
        <div className="sk-band" key={i}>
          <Line w="28%" h={26} /><Line /><Line w="96%" /><Line w="82%" />
        </div>
      ))}
    </div>
  );
}

// Placeholder for the Start Planning screens: progress, step circles, options and the cart column.
export function PlanSkeleton() {
  return (
    <div className="flow plan" role="status" aria-busy="true" aria-label="Loading your planning steps">
      <div className="plan-head">
        <div className="sk" style={{ height: 8, borderRadius: 4 }} />
        <div className="sk-steps">{Array.from({ length: 9 }, (_, i) => <span key={i} className="sk sk-dot" />)}</div>
      </div>
      <div className="plan-grid">
        <div className="plan-main">
          <Line w="62%" h={38} />
          <div style={{ height: 14 }} />
          <Line w="48%" h={18} />
          <div style={{ height: 22 }} />
          {[0, 1, 2].map((i) => <div key={i} className="sk sk-card" />)}
        </div>
        <div className="plan-cart"><div className="plan-cart-in"><div className="sk sk-cart" /></div></div>
      </div>
    </div>
  );
}

// Neutral full-height placeholder (admin / auth checks).
export const FullSkeleton = () => <div className="sk-full" role="status" aria-busy="true" aria-label="Loading"><span className="sk sk-spin" /></div>;
