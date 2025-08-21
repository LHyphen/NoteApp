import React from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="modal-button cancel" onClick={onClose}>取消</button>
          <button className="modal-button confirm" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
