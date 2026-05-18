/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  Send, 
  Loader2, 
  ClipboardCheck, 
  History, 
  SendHorizontal,
  CheckCircle2
} from 'lucide-react';

// Design Recipe 1: Technical Dashboard / Data Grid (Inspired)
// Mood: Professional, Precise, Technical.

export default function App() {
  const [notes, setNotes] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMinutes = async () => {
    if (!notes.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate minutes');
      }
      
      setMinutes(data.minutes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    // Generate Rich HTML for the clipboard for perfect DOCX integration
    let htmlContent = minutes
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/^- (.*)/gm, '<li style="margin-bottom: 4pt; margin-left: 20pt;">$1</li>') // Real bullets
      .replace(/^\[ \] (.*)/gm, '<div style="margin-bottom: 6pt; margin-left: 5pt; font-family: \'Segoe UI Symbol\', sans-serif;">☐ &nbsp; $1</div>') // Checkboxes
      .replace(/^\[x\] (.*)/gm, '<div style="margin-bottom: 6pt; margin-left: 5pt; font-family: \'Segoe UI Symbol\', sans-serif;">☑ &nbsp; $1</div>') // Checked
      .replace(/\n\n/g, '<p style="margin-top: 14pt; margin-bottom: 6pt;"></p>') // Section spacing
      .replace(/\n/g, '<br/>');
    
    // Clean up list containers
    htmlContent = htmlContent.replace(/(<li.*<\/li>)/gs, '<ul style="margin-top: 6pt; margin-bottom: 6pt;">$1</ul>');

    const finalHtml = `
      <div style="font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.6;">
        ${htmlContent}
      </div>
    `;

    const blobHtml = new Blob([finalHtml], { type: 'text/html' });
    const blobText = new Blob([minutes.replace(/\*\*/g, '')], { type: 'text/plain' });
    
    try {
      if (typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText,
          })
        ]);
      } else {
        await navigator.clipboard.writeText(minutes.replace(/\*\*/g, ''));
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      navigator.clipboard.writeText(minutes.replace(/\*\*/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* HUD Header */}
      <header className="border-b border-[#141414] px-6 py-4 flex justify-between items-center bg-[#DCDAD6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] flex items-center justify-center transform -rotate-2 border-2 border-[#141414] shadow-lg">
            <ClipboardCheck className="text-[#E4E3E0] size-6" />
          </div>
          <div>
            <h1 className="font-mono text-sm uppercase tracking-widest font-black">MinuteMaster_v1.5</h1>
            <p className="font-serif italic text-[10px] opacity-60 uppercase tracking-widest font-bold">Neural Protocol Synthesis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest opacity-80 uppercase">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-bold">Stream_Active</span>
          </div>
          <div className="hidden sm:block border-l-2 border-[#141414] pl-6 font-bold">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-74px)]">
        {/* Left Column: Input */}
        <section className="border-r-2 border-[#141414] flex flex-col bg-[#F5F4F2]">
          <div className="p-6 border-b-2 border-[#141414] flex justify-between items-center bg-[#DCDAD6]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 border border-indigo-200">
                <FileText size={18} className="text-indigo-900" />
              </div>
              <h2 className="font-mono text-xs uppercase font-black">Input Buffer</h2>
            </div>
            <button 
              onClick={() => setNotes('')}
              className="font-mono text-[9px] uppercase border-2 border-[#141414] px-3 py-1 font-bold hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
            >
              Clear Buffer
            </button>
          </div>
          
          <div className="flex-1 relative bg-white/50">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste raw meeting notes or observations here..."
              className="w-full h-full p-8 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed placeholder:opacity-30"
            />
            
            <div className="absolute bottom-8 right-8">
              <button
                onClick={generateMinutes}
                disabled={isProcessing || !notes.trim()}
                className={`
                  flex items-center gap-4 px-10 py-5 font-mono text-sm uppercase tracking-widest font-black
                  transition-all duration-300 transform border-2 border-[#141414]
                  ${isProcessing || !notes.trim() 
                    ? 'bg-[#A0A09B] cursor-not-allowed opacity-50 grayscale' 
                    : 'bg-[#141414] text-[#E4E3E0] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_rgba(20,20,20,0.15)] active:translate-x-0 active:translate-y-0 active:shadow-none'}
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin size-5" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SendHorizontal size={18} />
                    Synthesize Protocol
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Output */}
        <section className="flex flex-col bg-[#EBEAE7]">
          <div className="p-6 border-b-2 border-[#141414] flex justify-between items-center bg-[#E0DFDC]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 border border-green-200">
                <ClipboardCheck size={18} className="text-green-800" />
              </div>
              <h2 className="font-mono text-xs uppercase font-black text-indigo-900">Synthesized Minutes</h2>
            </div>
            {minutes && (
              <button 
                onClick={copyToClipboard}
                className={`
                  font-mono text-[10px] uppercase border-2 px-4 py-2 transition-all flex items-center gap-3 font-black
                  ${copied 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'border-indigo-900 text-indigo-900 bg-white hover:bg-indigo-900 hover:text-white'}
                `}
              >
                {copied ? <CheckCircle2 size={14} /> : null}
                {copied ? 'Copied to DOCX' : 'Copy for Word (DOCX)'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-[#F0EFEE]">
            <AnimatePresence mode="wait">
              {minutes ? (
                <motion.div
                  key="minutes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-10 font-sans text-sm leading-relaxed"
                >
                  <div className="max-w-prose mx-auto bg-white p-12 border-2 border-[#141414] shadow-[12px_12px_0px_#141414] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <ClipboardCheck size={72} />
                    </div>
                    <div className="markdown-body selection:bg-indigo-100 selection:text-indigo-900 border-l-4 border-indigo-900 pl-8 text-[#1a1a1a]">
                      <ReactMarkdown 
                        components={{
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-6 text-gray-800">{children}</ul>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          p: ({ children }) => {
                            const getChildText = (node: any): string => {
                              if (typeof node === 'string') return node;
                              if (Array.isArray(node)) return node.map(getChildText).join('');
                              if (node?.props?.children) return getChildText(node.props.children);
                              return '';
                            };
                            
                            const textContent = getChildText(children).trim();
                            
                            if (textContent.startsWith('[ ]') || textContent.startsWith('[x]')) {
                              const isChecked = textContent.startsWith('[x]');
                              const processedChildren = React.Children.map(children, (child, i) => {
                                if (i === 0 && typeof child === 'string') {
                                  return child.replace(/^\[[ x]\]\s*/, '');
                                }
                                return child;
                              });

                              return (
                                <div className="flex items-start gap-2.5 mb-1.5 group">
                                  <div className="mt-0.5 flex-shrink-0 w-4 h-4 border-2 border-[#141414] flex items-center justify-center text-[10px] font-black bg-white group-hover:bg-indigo-50 transition-colors">
                                    {isChecked ? '✓' : ''}
                                  </div>
                                  <div className="flex-1 text-[#222] leading-snug">{processedChildren}</div>
                                </div>
                              );
                            }
                            return <p className="mb-6 last:mb-0 leading-relaxed">{children}</p>;
                          },
                          strong: ({ children }) => <strong className="font-bold text-black uppercase tracking-tight text-xs border-b-2 border-black/10 pb-0.5">{children}</strong>,
                        }}
                      >
                        {minutes}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <p className="mt-6 text-center font-mono text-[9px] opacity-40 uppercase tracking-[0.2em] font-black">Verified MS Word Interoperability</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="h-full flex flex-col items-center justify-center p-16 text-center"
                >
                  <History size={64} strokeWidth={1} className="mb-6 opacity-30 text-[#141414]" />
                  <p className="font-serif italic text-2xl mb-3 text-gray-800">Protocol Buffer Standby</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest font-bold max-w-xs leading-loose">Data will be synthesized into the requested protocol format with checkboxes and grouped action units.</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {error && (
              <div className="m-8 p-6 border-2 border-red-500 bg-red-50 text-red-900 font-mono text-[11px] uppercase font-black">
                <span className="bg-red-500 text-white px-2 mr-2">SYS_ERR:</span> {error}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
