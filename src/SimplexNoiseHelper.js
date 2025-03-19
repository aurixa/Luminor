/**
 * SimplexNoiseHelper.js
 * A basic noise implementation that can be used if no other SimplexNoise is available
 */

// Create a fallback SimplexNoise implementation only if needed
(function() {
    // Skip if SimplexNoise is already defined
    if (typeof window.SimplexNoise !== 'undefined') {
        console.log("SimplexNoise already available, skipping fallback");
        return;
    }
    
    console.log("Creating SimplexNoise fallback implementation");
    
    // Very simple alternative noise implementation
    window.SimplexNoise = class {
        constructor(seed) {
            this.seed = seed || Math.random() * 10000;
            console.log("Using SimplexNoise fallback with seed:", this.seed);
        }
        
        // Basic 2D noise
        noise(x, y) {
            return Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 0.5 + 0.5;
        }
        
        // Basic 3D noise
        noise3d(x, y, z) {
            return (
                Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + this.seed) * 0.5 + 0.5 +
                Math.sin(x * 39.346 + y * 11.135 + z * 83.155 + this.seed * 1.5) * 0.25 + 0.25
            ) / 1.5;
        }
    };
    
    console.log("Fallback SimplexNoise implementation created and globally available");
})(); 