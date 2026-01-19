// Toast hook - Show notifications
export function useToast() {
  const showSuccess = (message: string) => {
    // TODO: Implement toast notification
    console.log('Success:', message);
  };
  
  const showError = (message: string) => {
    console.log('Error:', message);
  };
  
  const showInfo = (message: string) => {
    console.log('Info:', message);
  };
  
  return {
    showSuccess,
    showError,
    showInfo
  };
}
