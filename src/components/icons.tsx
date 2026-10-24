/* Icon sets ported from the Laravel baseline: app shell paths and Lucide (ISC) public icons. */
import type { SVGProps } from "react";

const appIcons = {
  "home": [
    "M3 10.5 12 3l9 7.5V21H3z",
    "M9 21v-8h6v8"
  ],
  "building": [
    "M4 21V7l8-4 8 4v14",
    "M9 21v-6h6v6",
    "M9 10h.01",
    "M15 10h.01",
    "M9 14h.01",
    "M15 14h.01"
  ],
  "users": [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75"
  ],
  "user": [
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8"
  ],
  "file": [
    "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z",
    "M14 3v6h6"
  ],
  "wrench": [
    "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4z"
  ],
  "map": [
    "M14 4 9 6 4 4v14l5 2 5-2 5 2V6l-5-2z",
    "M9 6v14",
    "M14 4v14"
  ],
  "card": [
    "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M3 10h18"
  ],
  "menu": [
    "M4 7h16",
    "M4 12h16",
    "M4 17h16"
  ],
  "download": [
    "M12 3v12",
    "m7 10 5 5 5-5",
    "M5 21h14"
  ],
  "printer": [
    "M6 9V3h12v6",
    "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
    "M6 14h12v7H6z"
  ],
  "sheet": [
    "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M3 9h18",
    "M3 15h18",
    "M9 3v18"
  ],
  "briefcase": [
    "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M3 13h18"
  ],
  "close": [
    "M6 6l12 12",
    "M18 6 6 18"
  ],
  "search": [
    "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16",
    "M21 21l-4.3-4.3"
  ],
  "globe": [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
    "M2 12h20",
    "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
  ],
  "bell": [
    "M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    "M10 21a2 2 0 0 0 4 0"
  ],
  "chevron": [
    "M6 9l6 6 6-6"
  ],
  "logout": [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "M16 17l5-5-5-5",
    "M21 12H9"
  ],
  "alert": [
    "M12 9v4",
    "M12 17h.01",
    "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
  ],
  "chat": [
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  ],
  "pin": [
    "M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11",
    "M12 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"
  ],
  "calendar": [
    "M8 3v3",
    "M16 3v3",
    "M4 9h16",
    "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
  ],
  "check": [
    "M5 12l5 5L20 7"
  ],
  "lock": [
    "M7 11V8a5 5 0 0 1 10 0v3",
    "M6 11h12v10H6z"
  ],
  "plus": [
    "M12 5v14",
    "M5 12h14"
  ],
  "zap": [
    "M13 2 3 14h9l-1 8 10-12h-9z"
  ],
  "droplet": [
    "M12 22a7 7 0 0 0 7-7c0-4-7-11-7-11S5 11 5 15a7 7 0 0 0 7 7z"
  ],
  "wind": [
    "M3 12h11a3 3 0 1 0-3-3",
    "M3 8h7a2 2 0 1 1-2 2",
    "M3 16h13a3 3 0 1 1-3 3"
  ],
  "sparkles": [
    "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z",
    "M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"
  ],
  "clock": [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",
    "M12 7v5l3 2"
  ],
  "phone": [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.32 1.6.57 2.36a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.72-1.14a2 2 0 0 1 2.11-.45c.76.25 1.55.44 2.36.57A2 2 0 0 1 22 16.92z"
  ],
  "mail": [
    "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
    "M22 8l-10 7L2 8"
  ],
  "eye": [
    "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6"
  ],
  "chevron-right": [
    "M9 18l6-6-6-6"
  ],
  "arrow-right": [
    "M5 12h14",
    "M12 5l7 7-7 7"
  ],
  "trending-up": [
    "m22 7-8.5 8.5-5-5L2 17",
    "M16 7h6v6"
  ],
  "trending-down": [
    "m22 17-8.5-8.5-5 5L2 7",
    "M16 17h6v-6"
  ],
  "wallet": [
    "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3h-4a2 2 0 0 0 0 4h4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"
  ],
  "inbox": [
    "M22 12h-6l-2 3h-4l-2-3H2",
    "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
  ],
  "shield": [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    "M9 12l2 2 4-4"
  ],
  "chart": [
    "M3 3v18h18",
    "M7 15l4-4 3 3 5-6"
  ],
  "route": [
    "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
    "M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
    "M8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"
  ],
  "refresh": [
    "M3 12a9 9 0 0 1 15.5-6.2L21 8",
    "M21 3v5h-5",
    "M21 12a9 9 0 0 1-15.5 6.2L3 16",
    "M8 16H3v5"
  ],
  "info": [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18",
    "M12 16v-4",
    "M12 8h.01"
  ],
  "image": [
    "M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
    "M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
    "M3 16l5-5 4 4 3-3 6 6"
  ]
} as const;

export type AppIconName = keyof typeof appIcons;

export function AppIcon({ name, className = "rf-ico", ...rest }: { name: AppIconName } & SVGProps<SVGSVGElement>) {
  const paths: readonly string[] = appIcons[name] ?? appIcons.home;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

const pubIcons = {
  "arrow-right": "<path d=\"M5 12h14\"/><path d=\"m12 5 7 7-7 7\"/>",
  "arrow-left": "<path d=\"m12 19-7-7 7-7\"/><path d=\"M19 12H5\"/>",
  "arrow-down": "<path d=\"M12 5v14\"/><path d=\"m19 12-7 7-7-7\"/>",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\"/>",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\"/>",
  "x": "<path d=\"M18 6 6 18\"/><path d=\"m6 6 12 12\"/>",
  "menu": "<path d=\"M4 6h16\"/><path d=\"M4 12h16\"/><path d=\"M4 18h16\"/>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.3-4.3\"/>",
  "sliders": "<path d=\"M20 7h-9\"/><path d=\"M14 17H5\"/><circle cx=\"17\" cy=\"17\" r=\"3\"/><circle cx=\"7\" cy=\"7\" r=\"3\"/>",
  "map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/>",
  "building": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\"/><path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\"/><path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\"/><path d=\"M10 6h4\"/><path d=\"M10 10h4\"/><path d=\"M10 14h4\"/><path d=\"M10 18h4\"/>",
  "store": "<path d=\"m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7\"/><path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"/><path d=\"M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4\"/><path d=\"M2 7h20\"/><path d=\"M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7\"/>",
  "briefcase": "<path d=\"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"/><rect width=\"20\" height=\"14\" x=\"2\" y=\"6\" rx=\"2\"/>",
  "warehouse": "<path d=\"M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z\"/><path d=\"M6 18h12\"/><path d=\"M6 14h12\"/><rect width=\"12\" height=\"12\" x=\"6\" y=\"10\"/>",
  "home": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"/><path d=\"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/>",
  "layers": "<path d=\"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z\"/><path d=\"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65\"/><path d=\"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65\"/>",
  "hash": "<path d=\"M4 9h16\"/><path d=\"M4 15h16\"/><path d=\"M10 3 8 21\"/><path d=\"M16 3l-2 18\"/>",
  "check": "<path d=\"M20 6 9 17l-5-5\"/>",
  "check-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m9 12 2 2 4-4\"/>",
  "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\"/>",
  "images": "<path d=\"M18 22H4a2 2 0 0 1-2-2V6\"/><path d=\"m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18\"/><circle cx=\"12\" cy=\"8\" r=\"2\"/><rect width=\"16\" height=\"16\" x=\"6\" y=\"2\" rx=\"2\"/>",
  "message": "<path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\"/>",
  "send": "<path d=\"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z\"/><path d=\"m21.854 2.147-10.94 10.939\"/>",
  "key": "<path d=\"m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4\"/><path d=\"m21 2-9.6 9.6\"/><circle cx=\"7.5\" cy=\"15.5\" r=\"5.5\"/>",
  "file": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"/><path d=\"M14 2v4a2 2 0 0 0 2 2h4\"/><path d=\"M10 9H8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/>",
  "calendar": "<path d=\"M8 2v4\"/><path d=\"M16 2v4\"/><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\"/><path d=\"M3 10h18\"/>",
  "wallet": "<path d=\"M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1\"/><path d=\"M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4\"/>",
  "shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"/><path d=\"m9 12 2 2 4-4\"/>",
  "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 16v-4\"/><path d=\"M12 8h.01\"/>",
  "alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 8v4\"/><path d=\"M12 16h.01\"/>",
  "refresh": "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>",
  "eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  "eye-off": "<path d=\"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49\"/><path d=\"M14.084 14.158a3 3 0 0 1-4.242-4.242\"/><path d=\"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143\"/><path d=\"m2 2 20 20\"/>",
  "phone": "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"/>",
  "maximize": "<path d=\"M8 3H5a2 2 0 0 0-2 2v3\"/><path d=\"M21 8V5a2 2 0 0 0-2-2h-3\"/><path d=\"M3 16v3a2 2 0 0 0 2 2h3\"/><path d=\"M16 21h3a2 2 0 0 0 2-2v-3\"/>",
  "play": "<polygon points=\"6 3 20 12 6 21 6 3\"/>",
  "video": "<path d=\"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5\"/><rect x=\"2\" y=\"6\" width=\"14\" height=\"12\" rx=\"2\"/>"
} as const;

export type PubIconName = keyof typeof pubIcons;

export function PubIcon({ name, size, className }: { name: PubIconName; size?: "sm" | "lg"; className?: string }) {
  const classes = ["pub-icon", size === "sm" && "pub-icon-sm", size === "lg" && "pub-icon-lg", className].filter(Boolean).join(" ");
  return (
    <svg className={classes} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: pubIcons[name] ?? pubIcons.info }} />
  );
}
