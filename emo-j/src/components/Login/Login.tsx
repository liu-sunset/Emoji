import { useState, useEffect } from 'react';
import './Login.css';

export interface LoginProps {
  onSuccess: () => void;
}

const CORRECT_PASSWORD = 'emo123';
const STORAGE_KEY = 'emo_j_login_time';
const PASSWORD_KEY = 'emo_j_password';
const LOGIN_DURATION = 24 * 60 * 60 * 1000;

function isLoginValid(): boolean {
  const loginTime = localStorage.getItem(STORAGE_KEY);
  if (!loginTime) return false;
  return Date.now() - parseInt(loginTime, 10) < LOGIN_DURATION;
}

export function Login({ onSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isLoginValid()) {
      onSuccess();
    }
  }, [onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      localStorage.setItem(PASSWORD_KEY, password);
      onSuccess();
    } else {
      setError('密码错误，请重新输入');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card ${isShaking ? 'shake' : ''}`}>
        <div className="login-header">
          <h1 className="login-title">EMO<span>.</span>J</h1>
          <p className="login-subtitle">表情包生成器</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="password"
              className="password-input"
              placeholder="请输入登录密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">
            登录
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
