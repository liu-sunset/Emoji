import './GenerateButton.css';

export interface GenerateButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  text?: string;
}

export function GenerateButton({
  onClick,
  loading,
  disabled,
  text = '生成图片'
}: GenerateButtonProps) {
  return (
    <button
      className={`generate-button ${loading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={disabled || loading}
      type="button"
    >
      {loading ? (
        <span className="loading-spinner"></span>
      ) : (
        <span className="button-text">{text}</span>
      )}
    </button>
  );
}