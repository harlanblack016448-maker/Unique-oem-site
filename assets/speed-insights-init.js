// Vercel Speed Insights initialization
// This script loads and initializes Vercel Speed Insights for tracking page performance
(function() {
  // Import and initialize the Speed Insights module
  import('/assets/speed-insights.js').then(function(module) {
    // Initialize Speed Insights
    // The injectSpeedInsights function will automatically inject the Vercel tracking script
    module.injectSpeedInsights({
      debug: false, // Set to true to enable debug logging in development
      framework: 'vanilla' // Specify framework for proper attribution
    });
  }).catch(function(error) {
    // Silently fail if Speed Insights cannot be loaded (e.g., due to content blockers)
    console.warn('Speed Insights could not be loaded:', error.message);
  });
})();
