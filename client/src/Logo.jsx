import React from 'react';

// Brand logo (client/public/logo.png). Falls back to text if the image is missing.
export default function Logo({ height = 68 }) {
  const [ok, setOk] = React.useState(true);
  return ok
    ? <img className="logo-img" src="/logo.png" alt="Gámez & Sons Funeral and Cremation Services" style={{ height }} onError={() => setOk(false)} />
    : <span className="logo-fallback">GÁMEZ &amp; SONS<small>Funeral and Cremation Services</small></span>;
}
