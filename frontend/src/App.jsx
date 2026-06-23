import React, { useState } from 'react';
import { UploadCloud, CheckCircle, XCircle, Copy } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import './index.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function App() {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsingStatus, setParsingStatus] = useState('idle');
  
  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysis, setAnalysis] = useState(null);
  const [optimizeStatus, setOptimizeStatus] = useState('idle');
  const [latexOutput, setLatexOutput] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = async (selectedFile) => {
    setFile(selectedFile);
    setAnalysisStatus('idle');
    setAnalysis(null);
    setLatexOutput('');
    setParsingStatus('parsing');
    
    try {
      if (selectedFile.name.endsWith('.pdf')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(s => s.str).join(' ') + '\n';
        }
        if (fullText.trim().length === 0) {
          alert('No text could be extracted. Please ensure your PDF is not an image/scan.');
          setFile(null);
          setResumeText('');
        } else {
          setResumeText(fullText);
        }
      } else if (selectedFile.name.endsWith('.docx')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value.trim().length === 0) {
          alert('No text could be extracted from this DOCX file.');
          setFile(null);
          setResumeText('');
        } else {
          setResumeText(result.value);
        }
      } else {
        alert('Only PDF and DOCX files are supported.');
        setFile(null);
        setResumeText('');
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing file.');
      setFile(null);
      setResumeText('');
    } finally {
      setParsingStatus('idle');
    }
  };

  const handleAnalyze = async () => {
    setAnalysisStatus('loading');
    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setAnalysisStatus('done');
    } catch (err) {
      console.error(err);
      alert('Analysis failed: ' + err.message);
      setAnalysisStatus('error');
    }
  };

  const handleOptimize = async () => {
    setOptimizeStatus('loading');
    try {
      const response = await fetch('http://localhost:5000/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setLatexOutput(data.latex);
      setOptimizeStatus('done');
    } catch (err) {
      console.error(err);
      alert('Optimization failed: ' + err.message);
      setOptimizeStatus('error');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 75) return 'var(--accent)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="app-container">
      <header>
        <h1>ATS Resume Checker</h1>
        <p className="subtitle">Upload your resume. Know your score. Get hired.</p>
      </header>

      {!analysis && (
        <div className="card">
          <label 
            className="drop-zone" 
            style={{ display: 'block', ...(isDragging ? { borderColor: 'var(--accent)', background: 'rgba(99, 102, 241, 0.05)' } : {}) }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept=".pdf,.docx" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <UploadCloud size={64} color="var(--accent)" style={{ margin: '0 auto 1.5rem' }} />
            {parsingStatus === 'parsing' ? (
              <>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Parsing file...</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Extracting text content</p>
              </>
            ) : file ? (
              <h3 style={{ margin: 0 }}>{file.name}</h3>
            ) : (
              <>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Drop your resume here</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Supports PDF and DOCX</p>
              </>
            )}
          </label>

          {file && resumeText && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button 
                className="btn" 
                onClick={handleAnalyze}
                disabled={analysisStatus === 'loading'}
                style={{ fontSize: '1.2rem', padding: '1rem 2.5rem' }}
              >
                {analysisStatus === 'loading' ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>
          )}
        </div>
      )}

      {analysis && (
        <>
          <div className="card">
            <div className="grid">
              <div className="score-ring-container">
                <div style={{
                  width: '180px', height: '180px', 
                  borderRadius: '50%', 
                  border: `12px solid ${getScoreColor(analysis.score)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '4rem', fontWeight: '800',
                  color: getScoreColor(analysis.score),
                  boxShadow: `0 0 30px ${getScoreColor(analysis.score)}33`
                }}>
                  {analysis.score}
                </div>
                <h2 style={{ marginTop: '1.5rem', color: getScoreColor(analysis.score), fontSize: '1.75rem', margin: '1.5rem 0 0 0' }}>
                  {analysis.grade}
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h2 style={{ margin: '0 0 1rem 0' }}>Summary</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 2rem 0' }}>{analysis.summary}</p>
                
                <h3 style={{ margin: '0 0 1rem 0' }}>Section Scores</h3>
                {Object.entries(analysis.section_scores || {}).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                      <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{key.replace('_', ' ')}</span>
                      <span style={{ fontWeight: 'bold' }}>{value}/100</span>
                    </div>
                    <div className="section-score-bar">
                      <div className="section-score-fill" style={{ width: `${value}%`, background: getScoreColor(value) }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card grid">
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}>
                ✅ Strengths
              </h3>
              <ul className="pros-cons-list">
                {analysis.pros?.map((pro, i) => (
                  <li key={i}><CheckCircle className="pro-icon" size={20} /> <span>{pro}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1.5rem 0' }}>
                ❌ Weaknesses
              </h3>
              <ul className="pros-cons-list">
                {analysis.cons?.map((con, i) => (
                  <li key={i}><XCircle className="con-icon" size={20} /> <span>{con}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Keywords</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Found in your resume:</strong>
              {analysis.keywords_found?.map((kw, i) => (
                <span key={i} className="chip found">{kw}</span>
              ))}
              {(!analysis.keywords_found || analysis.keywords_found.length === 0) && (
                <span style={{ color: 'var(--text-secondary)' }}>No important keywords found.</span>
              )}
            </div>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Missing (Consider adding):</strong>
              {analysis.keywords_missing?.map((kw, i) => (
                <span key={i} className="chip missing">{kw}</span>
              ))}
              {(!analysis.keywords_missing || analysis.keywords_missing.length === 0) && (
                <span style={{ color: 'var(--text-secondary)' }}>You have all the necessary keywords!</span>
              )}
            </div>
          </div>

          {!latexOutput && (
            <div style={{ textAlign: 'center', margin: '3rem 0' }}>
              <button 
                className="btn" 
                style={{ fontSize: '1.25rem', padding: '1rem 2.5rem' }}
                onClick={handleOptimize}
                disabled={optimizeStatus === 'loading'}
              >
                {optimizeStatus === 'loading' ? 'Generating LaTeX...' : 'Optimize Resume →'}
              </button>
            </div>
          )}

          {latexOutput && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>📄 Optimized LaTeX Resume</h3>
                <button 
                  className="btn" 
                  onClick={() => navigator.clipboard.writeText(latexOutput)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '0.5rem 1rem' }}
                >
                  <Copy size={16} /> Copy Code
                </button>
              </div>
              <pre>{latexOutput}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
