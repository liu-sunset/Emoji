import { useState, useEffect } from 'react';
import {
  styleOptions,
  bubblePresets,
  buildPrompt,
  DEFAULT_STYLE,
  DEFAULT_BUBBLE_TEXT,
} from '../../utils/promptConfig';
import './PromptEditor.css';

interface PromptEditorProps {
  onPromptChange: (prompt: string) => void;
}

type SelectSection = 'style' | 'bubbles';

const PromptEditor: React.FC<PromptEditorProps> = ({
  onPromptChange,
}) => {
  const [selectedStyle, setSelectedStyle] = useState(DEFAULT_STYLE);
  const [selectedBubbles, setSelectedBubbles] = useState<string[]>(DEFAULT_BUBBLE_TEXT);
  const [selectedPresetId, setSelectedPresetId] = useState('preset1');
  const [selectSection, setSelectSection] = useState<SelectSection>('style');
  const [customStyle, setCustomStyle] = useState('');

  useEffect(() => {
    const currentStyle = selectedStyle === '自定义风格' ? customStyle : selectedStyle;
    const newPrompt = buildPrompt(currentStyle, selectedBubbles);
    onPromptChange(newPrompt);
  }, [selectedStyle, selectedBubbles, customStyle, onPromptChange]);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = bubblePresets.find((p) => p.id === presetId);
    if (preset) {
      setSelectedBubbles(preset.texts);
    }
  };

  const handleBubbleTextChange = (index: number, value: string) => {
    const newBubbles = [...selectedBubbles];
    newBubbles[index] = value;
    setSelectedBubbles(newBubbles);
  };

  const handleStyleSelect = (styleName: string) => {
    setSelectedStyle(styleName);
    if (styleName !== '自定义风格') {
      setCustomStyle('');
    }
  };

  return (
    <div className="prompt-editor">
      <div className="prompt-editor-header">
        <h3 className="prompt-editor-title">提示词编辑</h3>
      </div>

      <div className="prompt-editor-content">
        <div className="section-tabs">
          <button
            className={`section-tab ${selectSection === 'style' ? 'active' : ''}`}
            onClick={() => setSelectSection('style')}
          >
            风格
          </button>
          <button
            className={`section-tab ${selectSection === 'bubbles' ? 'active' : ''}`}
            onClick={() => setSelectSection('bubbles')}
          >
            气泡文字
          </button>
        </div>

        <div className="section-content">
          {selectSection === 'style' && (
            <div className="style-section">
              <p className="section-description">选择表情包风格（默认：卡通风）</p>
              <div className="options-grid">
                {styleOptions.map((option) => (
                  <button
                    key={option.id}
                    className={`option-card ${selectedStyle === option.name ? 'selected' : ''}`}
                    onClick={() => handleStyleSelect(option.name)}
                  >
                    <span className="option-name">{option.name}</span>
                    <span className="option-desc">{option.description}</span>
                  </button>
                ))}
              </div>
              {selectedStyle === '自定义风格' && (
                <div className="custom-input-wrapper">
                  <input
                    type="text"
                    className="custom-input"
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    placeholder="输入你想要的风格描述，如：复古港风、二次元萌系..."
                  />
                </div>
              )}
            </div>
          )}

          {selectSection === 'bubbles' && (
            <div className="bubbles-section">
              <p className="section-description">选择气泡文字预设或自定义编辑</p>

              <div className="preset-selector">
                {bubblePresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={`preset-button ${selectedPresetId === preset.id ? 'active' : ''}`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="bubbles-grid">
                {selectedBubbles.map((text, index) => (
                  <div key={index} className="bubble-item">
                    <label className="bubble-label">气泡 {index + 1}</label>
                    <input
                      type="text"
                      className="bubble-input"
                      value={text}
                      onChange={(e) => handleBubbleTextChange(index, e.target.value)}
                      placeholder={`气泡 ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
