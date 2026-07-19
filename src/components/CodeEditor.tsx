import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Play, Trash2, Maximize2, Minimize2, Terminal, FileCode, Copy, Check, RotateCcw
} from 'lucide-react';

const DEFAULT_TEMPLATES: { [key: string]: string } = {
  python: `# Write Python 3 code in this editor and run it.\n\ndef main():\n    print("Hello, World!")\n    # Practice your Python coding here\n\nmain()`,
  javascript: `// Write JavaScript code in this editor and run it.\n\nfunction main() {\n    console.log("Hello, World!");\n    // Practice your JavaScript coding here\n}\n\nmain();`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body {\n      font-family: system-ui, -apple-system, sans-serif;\n      padding: 30px;\n      text-align: center;\n      background: #f8fafc;\n      color: #0f172a;\n    }\n    h1 {\n      color: #2563eb;\n    }\n  </style>\n</head>\n<body>\n  <h1>Live HTML Practice Workspace</h1>\n  <p>Modify this code and watch it render instantly in real-time!</p>\n</body>\n</html>`,
  sql: `-- Write SQL queries here\n-- Tables available: users, orders, products\n\nSELECT * FROM users WHERE status = 'active';`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        // Practice your Java coding here\n    }\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    // Practice your C++ coding here\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    // Practice your C coding here\n    return 0;\n}`
};

interface LanguageOption {
  id: string;
  name: string;
  iconName: string;
  defaultFile: string;
}

export default function CodeEditor() {
  const [selectedLang, setSelectedLang] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('Code ready to run. Click "Run" to process.');
  const [isError, setIsError] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const languages: LanguageOption[] = [
    { id: 'python', name: 'Python', iconName: '🐍', defaultFile: 'main.py' },
    { id: 'javascript', name: 'JavaScript', iconName: 'JS', defaultFile: 'script.js' },
    { id: 'html', name: 'HTML5 / CSS3', iconName: '🌐', defaultFile: 'index.html' },
    { id: 'sql', name: 'SQL', iconName: '🛢️', defaultFile: 'query.sql' },
    { id: 'java', name: 'Java', iconName: '☕', defaultFile: 'Main.java' },
    { id: 'cpp', name: 'C++', iconName: 'C++', defaultFile: 'main.cpp' },
    { id: 'c', name: 'C', iconName: 'C', defaultFile: 'program.c' },
  ];

  useEffect(() => {
    setCode(DEFAULT_TEMPLATES[selectedLang] || '');
    setOutput('Code loaded. Click "Run" to process.');
    setIsError(false);
  }, [selectedLang]);

  // Safe Javascript executing console capture
  const executeJavaScript = (jsCode: string) => {
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERROR] ' + args.join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.join(' '));
      }
    };

    try {
      if (jsCode.includes('while(true') || jsCode.includes('while (true')) {
        setIsError(true);
        return 'Runtime Error: Process terminated - potential infinite loop detected.';
      }
      
      const wrappedCode = `
        (function(console) {
          try {
            ${jsCode}
          } catch (e) {
            console.error(e.message);
          }
        })(customConsole);
      `;
      
      const runFn = new Function('customConsole', wrappedCode);
      runFn(customConsole);
      
      const errorLog = logs.find(log => log.startsWith('[ERROR]'));
      if (errorLog) {
        setIsError(true);
        return errorLog;
      }
      
      setIsError(false);
      return logs.length > 0 ? logs.join('\n') : 'Code executed successfully. (No output printed)';
    } catch (e: any) {
      setIsError(true);
      return `Syntax/Runtime Error: ${e.message}`;
    }
  };

  // Mock engine for SQL queries
  const executeSQL = (sqlQuery: string) => {
    const cleanQuery = sqlQuery.trim();
    if (!cleanQuery) {
      setIsError(true);
      return 'SQL Syntax Error: Query is empty.';
    }
    
    if (!cleanQuery.toUpperCase().startsWith('SELECT') && 
        !cleanQuery.toUpperCase().startsWith('INSERT') && 
        !cleanQuery.toUpperCase().startsWith('UPDATE') && 
        !cleanQuery.toUpperCase().startsWith('CREATE') &&
        !cleanQuery.toUpperCase().startsWith('DELETE')) {
      setIsError(true);
      return `SQL Syntax Error: Query must start with SELECT, INSERT, UPDATE, DELETE, or CREATE statement.`;
    }

    if (cleanQuery.toUpperCase().startsWith('SELECT')) {
      const tableNameMatch = cleanQuery.match(/FROM\s+([a-zA-Z_0-9]+)/i);
      const tableName = tableNameMatch ? tableNameMatch[1] : 'users';
      
      if (!cleanQuery.toUpperCase().includes('FROM')) {
        setIsError(true);
        return `SQL Syntax Error: missing FROM keyword in SELECT statement.`;
      }

      setIsError(false);
      return `+------------+-------------+----------+\n| ID         | Name        | Status   |\n+------------+-------------+----------+\n| 1          | Alex Rivera | Active   |\n| 2          | Sam Taylor  | Active   |\n| 3          | Jordan Lee  | Inactive |\n+------------+-------------+----------+\n(3 rows fetched from table '${tableName}')`;
    }

    setIsError(false);
    return `Query executed successfully.\nRows affected: 1.`;
  };

  // Safe Python syntax verification and interpreter
  const executePython = (pyCode: string) => {
    // Check parenthesis match
    const openParens = (pyCode.match(/\(/g) || []).length;
    const closeParens = (pyCode.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      setIsError(true);
      return `SyntaxError: unmatched parenthesis. Found ${openParens} '(' and ${closeParens} ')'.`;
    }
    
    // Check indentation of blocks
    const lines = pyCode.split('\n');
    let currentIndentRequired = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (currentIndentRequired) {
        const indent = line.search(/\S/);
        if (indent === 0) {
          setIsError(true);
          return `IndentationError: expected an indented block on line ${i + 1}:\n  "${line}"`;
        }
        currentIndentRequired = false;
      }
      
      if (trimmed.endsWith(':')) {
        currentIndentRequired = true;
      }
    }

    const logs: string[] = [];
    const vars: { [key: string]: any } = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.includes('=')) {
        const parts = trimmed.split('=');
        if (parts.length === 2) {
          const varName = parts[0].trim();
          const varValExpr = parts[1].trim();
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
            try {
              if (/^[0-9\s+\-*/()]+$/.test(varValExpr)) {
                vars[varName] = eval(varValExpr);
              } else {
                vars[varName] = varValExpr.replace(/['"]/g, '');
              }
            } catch {
              vars[varName] = varValExpr;
            }
          }
        }
      }

      if (trimmed.startsWith('print(')) {
        const match = trimmed.match(/print\s*\(\s*(.*)\s*\)/);
        if (match) {
          const arg = match[1].trim();
          if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
            logs.push(arg.substring(1, arg.length - 1));
          } else if (vars[arg] !== undefined) {
            logs.push(String(vars[arg]));
          } else {
            try {
              if (/^[0-9\s+\-*/()]+$/.test(arg)) {
                logs.push(String(eval(arg)));
              } else {
                logs.push(arg);
              }
            } catch {
              logs.push(arg);
            }
          }
        }
      }
    }

    setIsError(false);
    return logs.length > 0 ? logs.join('\n') : 'Process finished with exit code 0 (No outputs printed)';
  };

  // Safe Java compiler syntax verification and print output capturing
  const executeJava = (javaCode: string) => {
    if (!javaCode.includes('class ') && !javaCode.includes('public class')) {
      setIsError(true);
      return 'Compile Error: class declaration expected (e.g. public class Main)';
    }
    if (!javaCode.includes('public static void main')) {
      setIsError(true);
      return 'Compile Error: main method not found in target class';
    }
    const openBraces = (javaCode.match(/\{/g) || []).length;
    const closeBraces = (javaCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      setIsError(true);
      return `Compile Error: Unbalanced curly braces (Found ${openBraces} '{' and ${closeBraces} '}')`;
    }

    const lines = javaCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.endsWith('{') || line.endsWith('}') || line.startsWith('class') || line.startsWith('public class') || line.startsWith('public static void main') || line.startsWith('import')) {
        continue;
      }
      if (!line.endsWith(';')) {
        setIsError(true);
        return `Compile Error: ';' expected on line ${i + 1}:\n  "${lines[i].trim()}"`;
      }
    }

    const logs: string[] = [];
    const printRegex = /System\.out\.print(ln)?\s*\(\s*(["'])(.*?)\2\s*\)/g;
    let match;
    while ((match = printRegex.exec(javaCode)) !== null) {
      logs.push(match[3]);
    }

    setIsError(false);
    return logs.length > 0 ? logs.join('\n') : 'Process finished with exit code 0';
  };

  // Safe C++ compiler syntax verification and print output capturing
  const executeCpp = (cppCode: string) => {
    if (!cppCode.includes('int main(')) {
      setIsError(true);
      return 'Compile Error: main function not found in target program';
    }
    const openBraces = (cppCode.match(/\{/g) || []).length;
    const closeBraces = (cppCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      setIsError(true);
      return `Compile Error: Unbalanced curly braces (Found ${openBraces} '{' and ${closeBraces} '}')`;
    }

    const lines = cppCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('#') || line.endsWith('{') || line.endsWith('}') || line.startsWith('int main') || line.startsWith('using namespace')) {
        continue;
      }
      if (!line.endsWith(';')) {
        setIsError(true);
        return `Compile Error: ';' expected on line ${i + 1}:\n  "${lines[i].trim()}"`;
      }
    }

    const logs: string[] = [];
    const coutRegex = /cout\s*<<\s*(["'])(.*?)\1\s*(<<\s*endl)?/g;
    let match;
    while ((match = coutRegex.exec(cppCode)) !== null) {
      logs.push(match[2]);
    }

    setIsError(false);
    return logs.length > 0 ? logs.join('\n') : 'Process finished with exit code 0';
  };

  // Safe C compiler syntax verification and print output capturing
  const executeC = (cCode: string) => {
    if (!cCode.includes('int main(')) {
      setIsError(true);
      return 'Compile Error: main function not found in target program';
    }
    const openBraces = (cCode.match(/\{/g) || []).length;
    const closeBraces = (cCode.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      setIsError(true);
      return `Compile Error: Unbalanced curly braces (Found ${openBraces} '{' and ${closeBraces} '}')`;
    }

    const lines = cCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('#') || line.endsWith('{') || line.endsWith('}') || line.startsWith('int main')) {
        continue;
      }
      if (!line.endsWith(';')) {
        setIsError(true);
        return `Compile Error: ';' expected on line ${i + 1}:\n  "${lines[i].trim()}"`;
      }
    }

    const logs: string[] = [];
    const printRegex = /printf\s*\(\s*(["'])(.*?)\1\s*\)/g;
    let match;
    while ((match = printRegex.exec(cCode)) !== null) {
      let cleanStr = match[2].replace(/\\n/g, '');
      logs.push(cleanStr);
    }

    setIsError(false);
    return logs.length > 0 ? logs.join('\n') : 'Process finished with exit code 0';
  };

  // Code runner coordinator
  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      let finalResult = '';
      if (selectedLang === 'javascript') {
        finalResult = executeJavaScript(code);
      } else if (selectedLang === 'python') {
        finalResult = executePython(code);
      } else if (selectedLang === 'sql') {
        finalResult = executeSQL(code);
      } else if (selectedLang === 'java') {
        finalResult = executeJava(code);
      } else if (selectedLang === 'cpp') {
        finalResult = executeCpp(code);
      } else if (selectedLang === 'c') {
        finalResult = executeC(code);
      } else if (selectedLang === 'html') {
        setIsError(false);
        finalResult = 'Live HTML practice rendering finished successfully.';
      } else {
        setIsError(false);
        finalResult = 'Process finished successfully with code 0';
      }
      setOutput(finalResult);
      setIsRunning(false);
    }, 400);
  };

  // Clipboard copy helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard support for Tab key inside editor textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = editorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Reset template structure
  const handleResetTemplate = () => {
    setCode(DEFAULT_TEMPLATES[selectedLang] || '');
    setOutput('Template structure reset.');
    setIsError(false);
  };

  const linesCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(linesCount, 1) }, (_, i) => i + 1);

  return (
    <div className={`space-y-5 ${isFullScreen ? 'fixed inset-0 bg-white dark:bg-slate-950 p-6 z-50 overflow-y-auto' : ''}`} id="code-editor-root">
      
      {/* Upper header information */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            {languages.find(l => l.id === selectedLang)?.name || 'Python'} Compiler
          </h2>
        </div>
      </div>

      {/* Main Split Pane Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-md min-h-[550px]">
        
        {/* LEFT LANGUAGES SELECTION SIDEBAR */}
        <div className="xl:col-span-1 bg-slate-50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800 flex xl:flex-col flex-wrap gap-2 p-3 items-center justify-center xl:justify-start">
          <div className="hidden xl:block text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center py-2 w-full mb-1">
            LANGS
          </div>
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLang(lang.id)}
                className={`group relative flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all border cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
                title={`Practice in ${lang.name}`}
              >
                <span className="text-sm font-bold font-mono">{lang.iconName}</span>
                <span className={`absolute bottom-0.5 text-[6px] font-black tracking-tighter uppercase ${
                  isSelected ? 'text-blue-100' : 'text-slate-400'
                }`}>
                  {lang.id.substring(0, 3)}
                </span>
              </button>
            );
          })}
        </div>

        {/* CENTER CODE AREA (WHITE/DARK EDITOR BACKGROUND) */}
        <div className="xl:col-span-6 bg-white dark:bg-slate-900 flex flex-col min-h-[450px] border-r border-slate-200 dark:border-slate-800">
          
          {/* Editor Header Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-950/80 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300">
                {languages.find(l => l.id === selectedLang)?.defaultFile || 'main.py'}
              </span>
            </div>

            {/* Programiz styled toolbar buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetTemplate}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                title="Reset Template Boilerplate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase hidden md:inline">Reset</span>
              </button>

              <button 
                onClick={handleCopyCode}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                title="Copy code to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[9px] font-bold uppercase hidden md:inline">
                  {copied ? 'Copied' : 'Copy'}
                </span>
              </button>

              <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all cursor-pointer"
                title={isFullScreen ? "Minimize Editor" : "Fullscreen Sandbox"}
              >
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-white text-white" /> {isRunning ? 'RUNNING...' : 'RUN'}
              </button>
            </div>
          </div>

          {/* Code writing text container (WHITE/DARK BG) */}
          <div className="flex-1 flex overflow-hidden font-mono text-xs bg-white dark:bg-slate-950 relative">
            
            {/* Gutter Line Numbers Column */}
            <div className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-right py-3 px-2 select-none min-w-[34px] border-r border-slate-200 dark:border-slate-800">
              {lineNumbers.map((num) => (
                <div key={num} className="h-5 leading-5 font-semibold text-[10px]">{num}</div>
              ))}
            </div>

            {/* Custom interactive text area */}
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 focus:outline-none resize-none font-mono text-xs leading-5 h-full overflow-y-auto"
              style={{ tabSize: 4 }}
              placeholder="// Write your code logic here to practice..."
            />
          </div>
        </div>

        {/* RIGHT INTERACTIVE OUTPUT PANEL */}
        <div className="xl:col-span-5 bg-slate-50 dark:bg-slate-900/40 border-t xl:border-t-0 border-slate-200 dark:border-slate-800 flex flex-col min-h-[250px]">
          
          {/* Output Header bar */}
          <div className="bg-slate-100/80 dark:bg-slate-950/80 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" /> Console Output
            </span>
            <button
              onClick={() => setOutput('Console ready. Code cleared.')}
              className="px-2 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* HTML dynamic visualizer or stdout capture */}
          {selectedLang === 'html' ? (
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
              <div className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[10px] px-3 py-1 font-bold border-b border-slate-200 dark:border-slate-800">
                🌐 Live Sandbox Browser Output:
              </div>
              <iframe
                title="Live Sandbox Web Rendering Frame"
                srcDoc={code}
                className="w-full flex-1 border-none bg-white dark:bg-white"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
            <div className="flex-1 p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950/40 overflow-y-auto whitespace-pre">
              {isError ? (
                <div className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 p-3.5 rounded-xl whitespace-pre-wrap">
                  ⚠️ {output}
                </div>
              ) : (
                <div className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl whitespace-pre-wrap min-h-full shadow-xs font-medium">
                  {output}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
