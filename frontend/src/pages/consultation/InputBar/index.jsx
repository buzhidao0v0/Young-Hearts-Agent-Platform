import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './index.css';

export default function InputBar({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  // 多行自适应
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value);
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-bar">
      <textarea
        ref={textareaRef}
        className="input-textarea"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={1000}
        placeholder="请输入咨询内容..."
        disabled={disabled}
        style={{ maxHeight: 120 }}
      />
      <button
        className={`send-btn${value.trim() && !disabled ? '' : ' disabled'}`}
        onClick={handleSend}
        disabled={!value.trim() || disabled}
      >发送</button>
    </div>
  );
}

InputBar.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
