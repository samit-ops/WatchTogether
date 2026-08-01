function getContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '99999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);
  }
  return container;
}

function createToast(message, type) {
  const container = getContainer();
  const toastEl = document.createElement('div');
  
  const colors = {
    success: '#4caf50',
    error: '#f44336',
    info: '#2196f3'
  };

  Object.assign(toastEl.style, {
    backgroundColor: colors[type] || '#333',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '4px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    opacity: '0',
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: 'auto'
  });

  toastEl.textContent = message;
  container.appendChild(toastEl);

  // Trigger fade in
  requestAnimationFrame(() => {
    toastEl.style.opacity = '1';
  });

  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.addEventListener('transitionend', () => {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    });
  }, 3000);
}

export const toast = {
  success: (msg) => createToast(msg, 'success'),
  error: (msg) => createToast(msg, 'error'),
  info: (msg) => createToast(msg, 'info')
};
