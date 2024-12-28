let notificationTimeout: NodeJS.Timeout;

type NotificationType = 'success' | 'error' | 'warning';

interface NotificationStyles {
  background: string;
  borderLeft: string;
}

const NOTIFICATION_STYLES: Record<NotificationType, NotificationStyles> = {
  success: {
    background: '#588a1b',
    borderLeft: '4px solid #3d6813'
  },
  error: {
    background: '#c23',
    borderLeft: '4px solid #a11'
  },
  warning: {
    background: '#f82',
    borderLeft: '4px solid #d60'
  }
};

export const showNotification = (message: string, type: NotificationType = 'success'): HTMLElement => {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  // Remove existing notification if any
  const existingNotification = document.getElementById('st_notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const styles = NOTIFICATION_STYLES[type];
  const notification = document.createElement('div');
  notification.id = 'st_notification';
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    background: styles.background,
    borderLeft: styles.borderLeft,
    color: '#fff',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '200px'
  });

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'st_notification_close';
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    marginLeft: '8px'
  });

  closeBtn.addEventListener('click', () => notification.remove());
  notification.appendChild(closeBtn);

  document.body.appendChild(notification);

  notificationTimeout = setTimeout(() => {
    notification.remove();
  }, 3000);

  return notification;
};

export const createLoadingSpinner = (): HTMLElement => {
  const spinner = document.createElement('div');
  spinner.className = 'st_spinner';
  
  Object.assign(spinner.style, {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #66c0f4',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'st_spin 0.6s linear infinite'
  });

  return spinner;
};

// Add spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes st_spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 