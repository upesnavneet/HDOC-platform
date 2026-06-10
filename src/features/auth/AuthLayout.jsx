import TiltCard from '../../components/TiltCard';

export default function AuthLayout({ children, alerts }) {
  return (
    <div className="auth-view-container">
      <TiltCard className="auth-card-wrapper press-card" maxTilt={12}>
        <div className="auth-header-logo">
          <h1>100 Days of Code</h1>
        </div>
        {alerts}
        {children}
      </TiltCard>
    </div>
  );
}
