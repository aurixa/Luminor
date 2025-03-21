/**
 * Luminor
 * Loading screen animation and management
 * Code written by a mixture of AI (2025)
 */

export function initializeLoadingScreen(): Promise<void> {
  return new Promise(resolve => {
    const loadingBar = document.getElementById('loading-bar') as HTMLDivElement;
    const loadingScreen = document.getElementById('loading-screen') as HTMLDivElement;
    const controlsInfo = document.getElementById('controls-info') as HTMLDivElement;
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const loadingText = document.querySelector('#loading-screen p') as HTMLParagraphElement;

    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);

        // Show start button
        loadingText.textContent = 'Ready to play!';
        startButton.style.display = 'block';

        // Wait for start button click
        startButton.addEventListener('click', () => {
          loadingScreen.style.display = 'none';
          controlsInfo.style.display = 'block';
          resolve();
        });
      }
      loadingBar.style.width = `${progress}%`;
    }, 200);
  });
}
