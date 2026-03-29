import { useState, useCallback } from 'react';
import { Login } from './components/Login/Login';
import { ImageUploader } from './components/ImageUploader/ImageUploader';
import PromptEditor from './components/PromptEditor/PromptEditor';
import { GenerateButton } from './components/GenerateButton/GenerateButton';
import { ResultViewer } from './components/ResultViewer/ResultViewer';
import { ExportPanel } from './components/ExportPanel/ExportPanel';
import { generateImage, type GenerateRequest, type GenerateResponse } from './utils/api';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('emo_j_login_time');
    setIsLoggedIn(false);
    setUploadedImage(null);
    setPrompt('');
    setGeneratedImageUrl(null);
    setGenerationError(null);
    setHasStartedGeneration(false);
  }, []);

  const handleImageUpload = useCallback((base64: string) => {
    setUploadedImage(base64);
    setGeneratedImageUrl(null);
    setGenerationError(null);
    setHasStartedGeneration(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) {
      setGenerationError('请先上传图片');
      return;
    }

    if (!prompt.trim()) {
      setGenerationError('请输入提示词');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setHasStartedGeneration(true);

    const request: GenerateRequest = {
      image_data: uploadedImage,
      prompt: prompt,
    };

    try {
      const response: GenerateResponse = await generateImage(request);

      if (response.success && response.image_url) {
        setGeneratedImageUrl(response.image_url);
      } else {
        setGenerationError(response.error || '生成失败');
      }
    } catch (error) {
      if (error instanceof Error) {
        setGenerationError(error.message);
      } else {
        setGenerationError('生成过程中出现未知错误');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [uploadedImage, prompt]);

  const handleRetry = useCallback(() => {
    setGeneratedImageUrl(null);
    setGenerationError(null);
    handleGenerate();
  }, [handleGenerate]);

  const handleExportAll = useCallback((blob: Blob) => {
    void blob;
    console.log('Exported ZIP blob');
  }, []);

  const handleExportSingle = useCallback((blob: Blob, index: number) => {
    void blob;
    void index;
  }, []);

  if (!isLoggedIn) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="navbar-brand">
          <h1 className="logo">EMO<span>.</span>J</h1>
          <span className="tagline">表情包生成器</span>
        </div>
        <button className="logout-button" onClick={handleLogout} type="button">
          退出登录
        </button>
      </header>

      <main className="main-content">
        <div className="content-grid">
          <section className="left-panel">
            <div className="panel-card">
              <h2 className="panel-title">上传图片</h2>
              <ImageUploader
                onImageUpload={handleImageUpload}
                uploadedImage={uploadedImage}
                disabled={isGenerating}
              />
            </div>
          </section>

          <section className="right-panel">
            <div className="panel-card">
              <PromptEditor
                onPromptChange={setPrompt}
              />
            </div>
            <GenerateButton
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={!uploadedImage || !prompt.trim()}
              text="生成图片"
            />
          </section>
        </div>

        {hasStartedGeneration && (
          <section className="result-section">
            <div className="result-grid">
              <div className="panel-card">
                <ResultViewer
                  imageUrl={generatedImageUrl}
                  loading={isGenerating}
                  error={generationError}
                  onRetry={handleRetry}
                />
              </div>
              {generatedImageUrl && (
                <div className="panel-card">
                  <ExportPanel
                    imageUrl={generatedImageUrl}
                    onExportAll={handleExportAll}
                    onExportSingle={handleExportSingle}
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
