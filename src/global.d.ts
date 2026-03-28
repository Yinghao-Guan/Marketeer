interface Window {
  norot?: {
    onWindowShown: (callback: () => void) => () => void;
  };
}
