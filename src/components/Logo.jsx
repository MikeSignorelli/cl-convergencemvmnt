export default function Logo({ height = 44 }) {
  return (
    <svg
      viewBox="0 0 200 42"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height, width: 'auto', display: 'block' }}
      aria-label="Convergence MVMNT"
    >
      <text
        x="0" y="30"
        fontFamily="'Saira Semi Condensed', sans-serif"
        fontSize="20" fontWeight="700"
        letterSpacing="2.4"
        fill="#F0EEE5"
      >
        CONVERGENCE
      </text>
      <text
        x="2" y="42"
        fontFamily="'Saira Semi Condensed', sans-serif"
        fontSize="10" fontWeight="600"
        letterSpacing="5"
        fill="#C2A064"
      >
        MVMNT
      </text>
    </svg>
  )
}
