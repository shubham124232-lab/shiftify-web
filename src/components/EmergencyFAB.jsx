// components/EmergencyFAB.jsx
export default function EmergencyFAB() {
  return (
    <a
      href="#emergency"
      className="emergency-fab"
      role="button"
      aria-label="Emergency Support — Get immediate help now"
    >
      <span aria-hidden="true">🆘</span>
      <span>Emergency Support</span>
      <span
        style={{
          width: 8, height: 8,
          background: '#fff',
          borderRadius: '50%',
          animation: 'blink 1s infinite',
        }}
        aria-hidden="true"
      ></span>
    </a>
  );
}
