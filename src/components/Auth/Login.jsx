import { useState } from 'react';
import { dataProvider } from '../../api/dataProvider';

export function LoginModal({ isOpen, onClose, onLogin }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+977');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await dataProvider.auth.requestOtp(phone);
      setDevOtp(result.devOtp); // For testing - shows OTP in dev mode
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await dataProvider.auth.verifyOtp(phone, otp);
      onLogin(result.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('phone');
    setOtp('');
    setError(null);
    setDevOtp(null);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        width: 360,
        maxWidth: '90%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }} data-testid="login-modal">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            {step === 'phone' ? '🗳️ Login' : '🔐 Enter OTP'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#ffebee',
            color: '#c62828',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {step === 'phone' ? (
          /* Phone Step */
          <form onSubmit={handleRequestOtp}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
              }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+9779800000000"
                data-testid="phone-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 16,
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  boxSizing: 'border-box',
                }}
                required
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Enter your Nepal phone number
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              data-testid="send-otp-button"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                background: loading ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>

            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#e3f2fd',
              borderRadius: 6,
              fontSize: 12,
              color: '#1565c0',
            }}>
              <strong>Test Account:</strong><br />
              Phone: +9779800000000<br />
              OTP: 123456
            </div>
          </form>
        ) : (
          /* OTP Step */
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: 8 }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1976d2',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                }}
              >
                ← Change number
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 12,
              }}>
                OTP sent to <strong>{phone}</strong>
              </div>

              <label style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
              }}>
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                data-testid="otp-input"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 24,
                  letterSpacing: 8,
                  textAlign: 'center',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  boxSizing: 'border-box',
                }}
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {/* Dev OTP hint */}
            {devOtp && (
              <div style={{
                marginBottom: 16,
                padding: 12,
                background: '#fff3e0',
                borderRadius: 6,
                fontSize: 12,
                color: '#e65100',
              }}>
                <strong>Dev Mode:</strong> OTP is <code>{devOtp}</code>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              data-testid="verify-button"
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                background: loading ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="user-menu-button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 6,
          color: 'white',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        <span style={{
          width: 28,
          height: 28,
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          👤
        </span>
        <span>{user.name || user.phone}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          minWidth: 180,
          overflow: 'hidden',
          zIndex: 100,
        }}>
          <div style={{
            padding: 12,
            borderBottom: '1px solid #eee',
            fontSize: 13,
          }}>
            <div style={{ fontWeight: 600 }}>{user.name || 'Citizen'}</div>
            <div style={{ color: '#666' }}>{user.phone}</div>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            data-testid="logout-button"
            style={{
              width: '100%',
              padding: 12,
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: 14,
              color: '#d32f2f',
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}
