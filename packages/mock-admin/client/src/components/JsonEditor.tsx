import { useEffect, useRef } from 'react';
import AceEditor from 'react-ace';

// 导入主题和模式
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export default function JsonEditor({ value, onChange, height = '400px', readOnly = false }: JsonEditorProps) {
  const editorRef = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current.editor;
      
      // 自动格式化初始内容（如果是有效的 JSON）
      try {
        const parsed = JSON.parse(value);
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== value) {
          onChange(formatted);
        }
      } catch (e) {
        // 如果不是有效 JSON，保持原样
      }
    }
  }, []);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div style={{ border: '1px solid #2d2d2d', borderRadius: 4, overflow: 'hidden' }}>
      <AceEditor
        ref={editorRef}
        mode="json"
        theme="monokai"
        name="json-editor"
        value={value}
        onChange={handleChange}
        width="100%"
        height={height}
        fontSize={13}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        readOnly={readOnly}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
          useWorker: true, // 启用语法检查
          wrap: true, // 自动换行
        }}
        editorProps={{ $blockScrolling: true }}
        style={{
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
          lineHeight: '1.6',
        }}
      />
    </div>
  );
}

