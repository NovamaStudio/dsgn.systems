// Placeholder pictures for previews and docs — small inline SVGs, no network, no stock photos.
const uri = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg.replace(/\s+/g, ' ').trim());

// a lake at dawn: sky gradient, sun, three hill layers, water
export const landscape = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c9a8"/><stop offset=".55" stop-color="#f3dcc4"/><stop offset="1" stop-color="#e9e3d6"/></linearGradient>
<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb4b8"/><stop offset="1" stop-color="#6f8a90"/></linearGradient></defs>
<rect width="640" height="360" fill="url(#s)"/><circle cx="430" cy="150" r="46" fill="#fbe7cf"/>
<path d="M0 210 L90 150 L170 196 L260 120 L360 200 L450 160 L540 205 L640 150 V360 H0Z" fill="#b8a99c"/>
<path d="M0 236 L120 186 L230 228 L330 178 L450 232 L560 196 L640 222 V360 H0Z" fill="#8c8379"/>
<path d="M0 250 C120 236 220 262 330 248 S540 236 640 252 V360 H0Z" fill="url(#w)"/>
<path d="M60 286 H220 M300 304 H520 M140 326 H300" stroke="#c9d5d6" stroke-width="3" stroke-linecap="round" opacity=".6"/></svg>`);

// a portrait placeholder: soft background, head and shoulders
export const portrait = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe0d8"/><stop offset="1" stop-color="#9fbfb2"/></linearGradient></defs>
<rect width="96" height="96" fill="url(#b)"/><circle cx="48" cy="40" r="17" fill="#e8c4a8"/>
<path d="M31 34 C31 18 65 18 65 34 C62 27 54 25 48 25 C42 25 34 27 31 34Z" fill="#5a4436"/>
<path d="M14 96 C16 72 32 62 48 62 C64 62 80 72 82 96Z" fill="#3f5f73"/></svg>`);

export const portrait2 = uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d9c6"/><stop offset="1" stop-color="#ddb79b"/></linearGradient></defs>
<rect width="96" height="96" fill="url(#b)"/><path d="M28 50 C26 22 70 22 68 50 L68 64 L28 64Z" fill="#2f2622"/>
<circle cx="48" cy="42" r="16" fill="#c99a7c"/><path d="M14 96 C16 72 32 63 48 63 C64 63 80 72 82 96Z" fill="#7a4a52"/></svg>`);
