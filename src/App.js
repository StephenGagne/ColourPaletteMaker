import React, { useState, useEffect, useRef } from 'react';

// Helper function to convert HSL to Hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0'); // convert to Hex and pad with 0
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Helper function to convert Hex to HSL
function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0]; // Return default if parsing fails

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return [h, s, l];
}

// Function to generate a random hex color
const getRandomHexColor = () => {
  const randomByte = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return `#${randomByte()}${randomByte()}${randomByte()}`;
};

// Component for a single color swatch
const ColorSwatch = ({ colorHex, onCopy }) => {
    // All swatches are now the same size (w-20 h-20)
    const sizeClasses = "w-20 h-20";
    return (
        <div className="flex flex-col items-center gap-2 p-2 transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer">
            <div
                className={`${sizeClasses} rounded-full shadow-md flex items-center justify-center border-2 border-gray-200`}
                style={{ backgroundColor: colorHex }}
                onClick={() => onCopy(colorHex)}
            >
                {/* We can optionally put something inside the circle here if needed */}
            </div>
            <span
                className="font-semibold text-sm text-gray-700"
                onClick={() => onCopy(colorHex)}
            >
                {colorHex.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 opacity-90">Click to copy</span>
        </div>
    );
};

// Main App Component
const App = () => {
  const [baseColor, setBaseColor] = useState(getRandomHexColor()); // Initialize with a random color
  const [palette, setPalette] = useState({
    analogous: [],
    complementary: [],
    monochromatic: [],
    accentedMonochromatic: [], // Added new palette type
  });
  const [randomPickerColors, setRandomPickerColors] = useState([]); // New state for random colors next to picker
  const [message, setMessage] = useState('');
  const messageTimeoutRef = useRef(null);

  // Function to generate and set random colors for the picker area
  const generateRandomPickerColors = () => {
    const colors = [];
    for (let i = 0; i < 4; i++) {
      colors.push(getRandomHexColor());
    }
    setRandomPickerColors(colors);
  };

  // Effect to generate palette whenever baseColor changes
  useEffect(() => {
    generatePalette(baseColor);
  }, [baseColor]);

  // Effect to generate initial random picker colors only once on mount
  useEffect(() => {
    generateRandomPickerColors();
  }, []); // Empty dependency array means this runs only once

  // Function to display messages (e.g., "Copied!")
  const showMessage = (msg) => {
    setMessage(msg);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 2000); // Message disappears after 2 seconds
  };

  // Function to copy hex code to clipboard
  const copyToClipboard = (hex) => {
    try {
      // Using execCommand for better iframe compatibility
      const textarea = document.createElement('textarea');
      textarea.value = hex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showMessage(`Copied ${hex} to clipboard!`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showMessage('Failed to copy!');
    }
  };

  // Function to export all colors of a given palette to clipboard
  const exportPaletteColors = (paletteName, colors) => {
    const formattedColors = colors.map(color => color.toUpperCase()).join(', ');
    const exportString = `${paletteName} Palette: ${formattedColors}`;
    try {
        const textarea = document.createElement('textarea');
        textarea.value = exportString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showMessage(`Copied ${paletteName} palette to clipboard!`);
    } catch (err) {
        console.error('Failed to copy palette: ', err);
        showMessage(`Failed to copy ${paletteName} palette!`);
    }
  };

  // Handler for direct hex input
  const handleHexInputChange = (e) => {
    const newHex = e.target.value;
    // Basic validation for hex color format
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(newHex) || newHex === '#') {
      setBaseColor(newHex.toUpperCase());
    }
  };

  // Main function to generate different color palettes
  const generatePalette = (hex) => {
    const [h, s, l] = hexToHsl(hex); // Get HSL values of the base color

    const generatedAnalogous = [];
    const generatedComplementary = [];
    const generatedMonochromatic = [];
    const generatedAccentedMonochromatic = []; // New array for accented monochromatic

    // Define the appropriate black once based on the base hue
    const appropriateBlack = hslToHex(h, Math.min(s, 20), 10); // Keep some saturation, very low lightness

    // Determine shades of primary
    const lightPrimary = hslToHex(h, s, Math.min(100, l + 20));
    const darkPrimary = hslToHex(h, s, Math.max(0, l - 20));

    // --- Analogous Colors ---
    // Conditional ordering based on base color lightness for main color and its shade
    if (l > 50) { // If main color is light
      generatedAnalogous.push(hex); // Main color (light)
      generatedAnalogous.push(darkPrimary); // Darker version of main color
    } else { // If main color is dark
      generatedAnalogous.push(lightPrimary); // Lighter version of main color
      generatedAnalogous.push(hex); // Main color (dark)
    }
    // Add two analogous colors
    generatedAnalogous.push(hslToHex((h + 30) % 360, s, l));
    generatedAnalogous.push(hslToHex((h + 60) % 360, s, l));
    generatedAnalogous.push(appropriateBlack); // Add black at the end

    // --- Complementary Colors (light, dark, light, dark, black) ---
    const complementaryHue = (h + 180) % 360;

    // Determine shades of complementary
    const lightComplementary = hslToHex(complementaryHue, s, Math.min(100, l + 20));
    const darkComplementary = hslToHex(complementaryHue, s, Math.max(0, l - 20));

    // Conditional ordering based on base color lightness for main color and its shade
    if (l > 50) { // If main color is light
      generatedComplementary.push(hex); // Main color (light)
      generatedComplementary.push(darkPrimary); // Darker version of main color
    } else { // If main color is dark
      generatedComplementary.push(lightPrimary); // Lighter version of main color
      generatedComplementary.push(hex); // Main color (dark)
    }

    generatedComplementary.push(lightComplementary);
    generatedComplementary.push(darkComplementary);
    generatedComplementary.push(appropriateBlack); // Add black at the end


    // --- Monochromatic Colors ---
    // Apply conditional ordering based on base color lightness for the first two colors
    if (l > 50) { // If main color is light
      generatedMonochromatic.push(hex); // 1st: Main color (light)
      generatedMonochromatic.push(darkPrimary); // 2nd: Darker version of main color
    } else { // If main color is dark
      generatedMonochromatic.push(lightPrimary); // 1st: Lighter version of main color
      generatedMonochromatic.push(hex); // 2nd: Main color (dark)
    }
    // Add remaining monochromatic shades (light then dark)
    generatedMonochromatic.push(hslToHex(h, s, Math.min(100, l + 20))); // 3rd: Lighter shade
    generatedMonochromatic.push(hslToHex(h, s, Math.max(0, l - 20))); // 4th: Darker shade
    generatedMonochromatic.push(appropriateBlack); // 5th: Black


    // --- Accented Palette ---
    // Main color and its shade (same logic as other palettes)
    if (l > 50) { // If main color is light
      generatedAccentedMonochromatic.push(hex); // Main color (light)
      generatedAccentedMonochromatic.push(darkPrimary); // Darker version of main color
    } else { // If main color is dark
      generatedAccentedMonochromatic.push(lightPrimary); // Lighter version of main color
      generatedAccentedMonochromatic.push(hex); // Main color (dark)
    }

    // Accent color and its shade logic based on base color saturation
    let accentColorHex;
    let [accentH, accentS, accentL] = [h, s, l]; // Initialize with base HSL

    // If base color is low saturation/grey, make accent a more saturated version of the base color
    if (s < 30) { // Threshold for "low saturation" or "grey"
      accentColorHex = hslToHex(h, 80, l); // Use base hue and lightness, but high saturation
      [accentH, accentS, accentL] = hexToHsl(accentColorHex); // Update accent HSL for shades
    } else { // If base color is already saturated, use a triadic accent
      const accentHue = (h + 120) % 360; // Triadic hue for accent
      accentColorHex = hslToHex(accentHue, s, l); // Use original saturation and lightness
      [accentH, accentS, accentL] = hexToHsl(accentColorHex); // Update accent HSL for shades
    }

    const lightAccent = hslToHex(accentH, accentS, Math.min(100, accentL + 20));
    const darkAccent = hslToHex(accentH, accentS, Math.max(0, accentL - 20));

    if (accentL > 50) { // If accent color is light
      generatedAccentedMonochromatic.push(accentColorHex); // Accent color (light)
      generatedAccentedMonochromatic.push(darkAccent); // Darker version of accent
    } else { // If accent color is dark
      generatedAccentedMonochromatic.push(lightAccent); // Lighter version of accent
      generatedAccentedMonochromatic.push(accentColorHex); // Accent color (dark)
    }

    generatedAccentedMonochromatic.push(appropriateBlack); // Add appropriate black

    setPalette({
      analogous: generatedAnalogous,
      complementary: generatedComplementary,
      monochromatic: generatedMonochromatic,
      accentedMonochromatic: generatedAccentedMonochromatic,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 to-gray-900 p-4 font-sans text-gray-800 flex items-center justify-center">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-4xl space-y-8 animate-fade-in-up">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-gray-800 mb-6">
          Colour Palette Generator
        </h1>

        {/* Color Picker Section */}
        <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg shadow-inner">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <label htmlFor="colorPicker" className="text-lg font-semibold text-gray-700">
              Choose your main colour:
            </label>
            <input
              type="color"
              id="colorPicker"
              value={baseColor}
              onChange={(e) => setBaseColor(e.target.value)}
              className="w-16 h-8 rounded-md cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110"
              style={{ backgroundColor: baseColor }} // Ensure background matches chosen color
            />
            {/* Replaced span with input for hex code */}
            <input
              type="text"
              value={baseColor.toUpperCase()}
              onChange={handleHexInputChange}
              className="w-32 text-xl font-bold text-gray-800 bg-gray-200 px-4 py-2 rounded-md border border-gray-300 text-center focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {/* Random Colors for Picker */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {randomPickerColors.map((color, index) => (
              <div
                key={`random-picker-${index}`}
                className="w-10 h-10 rounded-full shadow-md cursor-pointer border border-gray-300 transition-all duration-200 hover:scale-110"
                style={{ backgroundColor: color }}
                onClick={() => setBaseColor(color)}
                title={`Set as main color: ${color.toUpperCase()}`}
              ></div>
            ))}
            <button
                onClick={generateRandomPickerColors}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm hover:bg-gray-300 transition-colors duration-200 text-sm"
            >
                New random colours
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce-in">
            {message}
          </div>
        )}

        {/* Generated Palettes Section */}
        <div className="space-y-8">
          {/* Monochromatic Palette */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Monochromatic Palette</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
              {palette.monochromatic.map((color, index) => (
                <ColorSwatch key={index} colorHex={color} onCopy={copyToClipboard} />
              ))}
            </div>
            <div className="flex w-full overflow-hidden mt-4">
              {palette.monochromatic.map((color, index) => (
                <div key={`monochromatic-strip-${index}`} className="flex-grow h-4" style={{ backgroundColor: color }}></div>
              ))}
            </div>
            <div className="flex justify-center mt-4"> {/* Wrapper div for centering */}
              <button
                  onClick={() => exportPaletteColors('Monochromatic', palette.monochromatic)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                  Export Palette
              </button>
            </div>
          </div>

          {/* Complementary Palette */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Complementary Palette</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
              {palette.complementary.map((color, index) => (
                <ColorSwatch key={index} colorHex={color} onCopy={copyToClipboard} />
              ))}
            </div>
            <div className="flex w-full overflow-hidden mt-4">
              {palette.complementary.map((color, index) => (
                <div key={`complementary-strip-${index}`} className="flex-grow h-4" style={{ backgroundColor: color }}></div>
              ))}
            </div>
            <div className="flex justify-center mt-4"> {/* Wrapper div for centering */}
              <button
                  onClick={() => exportPaletteColors('Complementary', palette.complementary)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                  Export Palette
              </button>
            </div>
          </div>

          {/* Accented Palette */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Accented Palette</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
              {palette.accentedMonochromatic.map((color, index) => (
                <ColorSwatch key={index} colorHex={color} onCopy={copyToClipboard} />
              ))}
            </div>
            <div className="flex w-full overflow-hidden mt-4">
              {palette.accentedMonochromatic.map((color, index) => (
                <div key={`accented-monochromatic-strip-${index}`} className="flex-grow h-4" style={{ backgroundColor: color }}></div>
              ))}
            </div>
            <div className="flex justify-center mt-4"> {/* Wrapper div for centering */}
              <button
                  onClick={() => exportPaletteColors('Accented', palette.accentedMonochromatic)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                  Export Palette
              </button>
            </div>
          </div>

          {/* Analogous Palette */}
          <div className="bg-gray-50 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Analogous Palette</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-items-center">
              {palette.analogous.map((color, index) => (
                <ColorSwatch key={index} colorHex={color} onCopy={copyToClipboard} />
              ))}
            </div>
            <div className="flex w-full overflow-hidden mt-4">
              {palette.analogous.map((color, index) => (
                <div key={`analogous-strip-${index}`} className="flex-grow h-4" style={{ backgroundColor: color }}></div>
              ))}
            </div>
            <div className="flex justify-center mt-4"> {/* Wrapper div for centering */}
              <button
                  onClick={() => exportPaletteColors('Analogous', palette.analogous)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm hover:bg-gray-300 transition-colors duration-200 text-sm"
              >
                  Export Palette
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
