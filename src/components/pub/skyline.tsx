/** Decorative skyline used by photo fallbacks (Laravel `x-pub.skyline`). Safe for server and client components. */
export function Skyline() {
  return (
    <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" focusable="false">
      <path d="M0 160V118h60v-30h44v30h28V70h70v90" />
      <path d="M202 160V96h40V60h64v100" />
      <path d="M306 160V108h52V40h86v120" />
      <path d="M444 160V88h34V66h58v94" />
      <path d="M536 160V120h46V24h92v136" />
      <path d="M674 160V98h40V74h70v86" />
      <path d="M784 160V56h78v104" />
      <path d="M862 160V112h38V84h64v76" />
      <path d="M964 160V46h70v114" />
      <path d="M1034 160V102h56V76h52v84" />
      <path d="M1142 160V114h58v46" />
      <path d="M558 48h48M558 72h48M558 96h48M806 80h34M806 104h34M328 64h42M328 88h42M986 70h26M986 94h26" strokeDasharray="6 8" />
    </svg>
  );
}
