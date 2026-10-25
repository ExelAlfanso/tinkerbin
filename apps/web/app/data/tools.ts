// Registry + explanatory copy for every indexable experience.
// Every experience is a browser-side creator tool (cat: 'tools')

export const CATS = {
  tools: "Creator tools",
};

export interface ToolContent {
  slug: string;
  minH?: number;
  cat: "tools";
  accent: string;
  schema: "DesignApplication" | "MultimediaApplication";
  adAfter?: number;
  name: string;
  blurb: string;
  title: string;
  description: string;
  features?: readonly string[];
  h1: string;
  lede: string;
  how: readonly string[];
  about: readonly string[];
  faq: readonly (readonly [string, string])[];
  related: readonly string[];
}

export const EXPS = [
  {
    about: [
      "<h2>Why pixel art palettes are built from ramps</h2><p>A pixel art palette works best when its colors are organized into ramps: short runs of shades that go from dark to light for one material, like skin, grass or stone. Instead of changing only lightness, good ramps also shift hue. Shadows drift toward blue and purple, highlights drift toward yellow and orange. That is why a palette with hue shifting looks richer than the same colors made by simply darkening and lightening.</p>",
      "<h2>What this generator does</h2><p>Every ramp is built from a base hue with a gentle hue shift at each end, and saturation peaks in the midtones and eases off in the darkest and lightest steps. The optional gray ramp is slightly cool so neutrals sit comfortably next to your colors. The preview scene paints a sky, hills, ground and a shaded orb using four of your ramps, with ordered dithering between steps, so you can judge the palette in context before you draw anything.</p>",
      '<h2>Using your palette</h2><p>Download a .gpl file to import into GIMP, Aseprite or Krita, or a plain .hex list that pixel art tools such as Aseprite and Lospec-compatible apps can load. Copy the CSS variables if you are using the colors in a game UI or website. The page address updates as you go, so copying the link shares the exact palette. You can also send the palette straight into the <a href="/pixel-art-palette-converter/">palette converter</a> to see how a picture looks in your colors.</p>',
    ],
    accent: "#34e0a1",
    blurb: "Hue-shifted color ramps built for pixel art.",
    cat: "tools",
    description:
      "Generate pixel art palettes with hue-shifted color ramps. Lock ramps, preview on a dithered scene, and export .gpl, .hex, PNG or CSS. Free, no sign-up.",
    faq: [
      [
        "How many colors should a pixel art palette have?",
        "There is no single answer. Many classic limits are 4, 16 or 32 colors. Smaller palettes force bolder choices and make cohesion easier. Start with three or four ramps of four to five shades and add only when you hit a real need.",
      ],
      [
        "What is hue shifting?",
        "Hue shifting means the hue changes slightly as a ramp gets darker or lighter, usually cooler in shadow and warmer in light. It mimics how light behaves and avoids the flat look of simple darkening.",
      ],
      [
        "Can I use these palettes in commercial work?",
        "Yes. Colors cannot be owned, and the palettes you generate here are yours to use however you like, with no attribution required.",
      ],
    ],
    h1: "Pixel palette generator",
    how: [
      "Pick a style: Natural, Neon, Pastel, Moody or Earthy.",
      "Choose how many ramps and how many shades per ramp, then press Generate or hit Space.",
      "Lock any ramp you like so it survives the next roll.",
      "Click a swatch to copy its HEX code, or export the whole palette as .gpl, .hex, PNG or CSS variables.",
    ],
    lede: "Generate palettes made of proper color ramps, with shadows that lean cool and highlights that lean warm. Lock the ramps you like, preview them on a tiny dithered scene, and export for Aseprite, GIMP and more.",
    minH: 700,
    name: "Pixel Palette Generator",
    related: [
      "pixel-art-palette-converter",
      "color-palette-generator",
      "background-remover",
    ],
    schema: "DesignApplication",
    slug: "pixel-palette-generator",
    title: "Pixel Palette Generator: Hue-Shifted Ramps for Pixel Art",
  },
  {
    about: [
      "<h2>Color harmony in plain terms</h2><p>Harmonies are patterns on the color wheel. Analogous colors sit next to each other and feel calm and cohesive. Complementary colors sit across the wheel and create strong contrast. Triadic and tetradic schemes space three or four hues evenly for lively variety. Monochrome keeps one hue and varies lightness and saturation, which is the safest route to a polished look.</p>",
      "<h2>Contrast matters as much as hue</h2><p>Each swatch shows the contrast ratio of its best text color, labelled against the WCAG thresholds: 4.5:1 for normal body text, 3:1 for large text, and 7:1 for the stricter AAA level. Check this before you commit to a palette for a website or app, because a palette that looks lovely can still be unreadable once real text goes on top.</p>",
      '<h2>From palette to project</h2><p>The sample card below the palette uses the lightest color as the background, the darkest as text and the most saturated as the action color. That is a quick way to judge a palette as an interface. Need a palette made for pixel art with proper shading ramps? Try the <a href="/pixel-palette-generator/">pixel palette generator</a>. Have a photo you love? Pull its colors out with the <a href="/image-color-extractor/">image color extractor</a>.</p>',
    ],
    accent: "#ff7ac8",
    blurb: "Harmonious palettes with contrast checks.",
    cat: "tools",
    description:
      "Generate color palettes with analogous, complementary, triadic and monochrome harmony. Lock colors, edit HEX, check contrast, and export CSS, JSON or Tailwind.",
    faq: [
      [
        "What is the 60-30-10 rule?",
        "It is a layout guideline: use a dominant color for about 60% of an interface, a secondary color for about 30% and an accent for about 10%. It keeps palettes balanced.",
      ],
      [
        "How do I keep a color and change the others?",
        "Press the Lock button on any color. Locked colors stay in place and the harmony of the new colors is based on the first locked one.",
      ],
      [
        "Is there a way to share the palette?",
        "Yes. The address in your browser updates with the palette, so copying the link shares it exactly.",
      ],
    ],
    h1: "Color palette generator",
    how: [
      "Choose a harmony: random, analogous, complementary, triadic, split, tetradic or monochrome.",
      "Pick how many colors you need, from three to eight, then press Generate or Space.",
      "Lock colors to keep them, or type a HEX code to set one yourself.",
      "Copy as HEX, CSS variables, JSON or a Tailwind config, or download a PNG.",
    ],
    lede: "Roll harmonious palettes using classic color relationships. Lock the colors you love, edit any HEX by hand, check text contrast at a glance, and see the palette working on a sample card.",
    minH: 640,
    name: "Color Palette Generator",
    related: [
      "pixel-palette-generator",
      "image-color-extractor",
      "background-remover",
    ],
    schema: "DesignApplication",
    slug: "color-palette-generator",
    title: "Color Palette Generator: Harmony, Contrast and Export",
  },
  {
    about: [
      "<h2>How the extraction works</h2><p>The tool shrinks your image to a small working copy and groups similar colors using median cut, a classic quantization method. It repeatedly splits the color space along its widest channel until it has the number of groups you asked for, then averages each group. The percentage next to each color shows how much of the image it represents, so you can tell a dominant color from an accent.</p>",
      "<h2>Private by design</h2><p>Your image is read by your browser and drawn to a canvas on your device. It is not uploaded, stored or sent anywhere, which makes it safe to use with client work and unreleased art.</p>",
      '<h2>What to use it for</h2><p>Build a palette from a reference photo before you start painting, match a website to a logo, study the colors of artwork you admire, or pull a limited palette for pixel art and then run it through the <a href="/pixel-art-palette-converter/">palette converter</a>. For a palette built from scratch, try the <a href="/color-palette-generator/">color palette generator</a>.</p>',
    ],
    accent: "#3ec6ff",
    blurb: "Pull a palette out of any image, privately.",
    cat: "tools",
    description:
      "Extract the dominant colors from any image in your browser. Pick exact pixels, copy HEX codes, and export palettes. Nothing is uploaded. Free, no sign-up.",
    faq: [
      [
        "Does my image get uploaded?",
        "No. The image is processed locally in your browser and never leaves your device.",
      ],
      [
        "Why are the extracted colors slightly different from the pixels I see?",
        "Each swatch is the average of a group of similar colors. Click the image to pick the exact color of a single pixel instead.",
      ],
      [
        "What image sizes work?",
        "Any size your browser can open. Large images are shrunk for sampling so results stay fast.",
      ],
    ],
    h1: "Image color extractor",
    how: [
      "Drop an image on the box, choose a file, or paste one from your clipboard.",
      "Use the slider to choose how many colors to extract, from 3 to 12.",
      "Click a swatch to copy its HEX, or click the image itself to pick any exact pixel.",
      "Export as HEX, CSS, .gpl or PNG, or send the palette to the pixel art converter.",
    ],
    lede: "Drop in a photo, screenshot or artwork and get its dominant colors as a ready-to-use palette. Click anywhere on the image to pick an exact pixel. Everything happens in your browser, so your image never leaves your device.",
    name: "Image Color Extractor",
    related: [
      "background-remover",
      "pixel-art-palette-converter",
      "color-palette-generator",
      "pixel-palette-generator",
    ],
    schema: "DesignApplication",
    slug: "image-color-extractor",
    title: "Image Color Extractor: Get a Palette From Any Picture",
  },
  {
    about: [
      "<h2>How the conversion works</h2><p>The image is scaled down to your chosen pixel width in stages for a cleaner result, then every pixel is matched to the nearest color in the palette using a weighted color distance that tracks how people see color. Transparent areas stay transparent, so cutouts keep their shape.</p>",
      "<h2>Dithering options</h2><p>Ordered dithering uses a 4×4 Bayer pattern and gives the crisp, regular crosshatch you see in classic games. Floyd–Steinberg diffuses the error to neighboring pixels for a smoother, more photographic look. Choosing none gives flat blocks of color, which is a good fit for logos and flat illustration.</p>",
      '<h2>Palettes included</h2><p>The PICO-8 palette was created for the PICO-8 fantasy console by Lexaloffle. Sweetie 16 is by GrafxKid. The Game Boy greens, Commodore 64 colors (Pepto-style values), CGA colors, 1-bit and gray ramps are widely used reference values. Want your own? Make a ramp-based palette with the <a href="/pixel-palette-generator/">pixel palette generator</a> and send it here, or extract one from any picture with the <a href="/image-color-extractor/">image color extractor</a>.</p>',
    ],
    accent: "#a98bff",
    blurb: "Turn any image into pixel art with a real palette.",
    cat: "tools",
    description:
      "Convert any image into pixel art using PICO-8, Game Boy, Sweetie 16, C64 or a custom palette, with ordered or Floyd–Steinberg dithering. Private and free.",
    faq: [
      [
        "What pixel width should I choose?",
        "32 to 64 pixels wide gives a bold, retro look. 96 to 192 keeps more detail. Smaller sizes need simpler source images.",
      ],
      [
        "Is my image uploaded?",
        "No. Conversion runs entirely in your browser.",
      ],
      [
        "Why do some palette colors look faded?",
        "Faded swatches in the palette strip are colors the converter did not need for this image.",
      ],
    ],
    h1: "Pixel art palette converter",
    how: [
      "Drop in an image or try the sample.",
      "Choose a palette: PICO-8, Game Boy, Sweetie 16, Commodore 64, CGA, 1-bit, a custom HEX list, or reduce colors from the image itself.",
      "Set the pixel width and the dithering style.",
      "Download the result at 1×, 4× or 8× scale.",
    ],
    lede: "Turn a photo or drawing into pixel art in a chosen palette. Pick a classic palette or your own, set the pixel size, choose a dithering style and download a crisp PNG at up to 8× scale.",
    name: "Pixel Art Palette Converter",
    related: [
      "pixel-palette-generator",
      "image-color-extractor",
      "background-remover",
    ],
    schema: "DesignApplication",
    slug: "pixel-art-palette-converter",
    title: "Pixel Art Palette Converter: Image to Pixel Art Online",
  },
  {
    about: [
      "<h2>What background removal does</h2><p>Background removal separates the subject of a picture (a person, a product, a pet) from everything behind it and makes the rest transparent. The result is a PNG with an alpha channel: every pixel carries its own transparency value, so edges can be partly see-through instead of jagged. You can then place the cutout on any color, photo or design.</p>",
      "<h2>How this tool works</h2><p>Tinkerbin runs a neural network called IS-Net, from the open DIS segmentation research project, inside your browser. It is executed by ONNX Runtime Web using WebAssembly. The network looks at your image at 1024 × 1024 pixels and predicts, for every pixel, how likely it is to belong to the main subject. That prediction is scaled back up to your photo's full size and used as the transparency layer. Fast mode uses a much smaller network, U²-Net-P, which downloads sooner but finds edges less precisely.</p><p>Because the model is large, it is downloaded only when you choose an image. Visiting this page, or any other page on Tinkerbin, does not download it. The first run fetches about 61 MB in Best quality or about 19 MB in Fast mode, and your browser keeps the files so later runs start within a few seconds.</p>",
      "<h2>Supported formats and size limits</h2><p>Upload PNG, JPG or WebP files up to 30 MB. Transparent PNG and WebP files work too, and existing transparency is kept. Large photos are scaled down to at most 4096 pixels on the long side, and to about 16 megapixels on computers or 10 on phones, so your browser does not run out of memory. The tool tells you when it has resized your image. The download is always a PNG at the processed size.</p>",
      "<h2>Privacy</h2><p>Your image is processed locally in your browser. It is read into memory on your device, passed to a background worker that runs the model, and the result is created on your device. The image is not uploaded to Tinkerbin or anyone else, and no server takes part in the processing. The only network traffic is the one-time download of the model files from Tinkerbin's own hosting, and you can confirm that in your browser's network panel. If analytics is switched on for the site, it counts events such as \"finished\" and never includes your image or file name.</p>",
      '<h2>Common uses</h2><ul><li>Product photos for shops and listings: cut out the item, then place it on white or a brand color.</li><li>Profile pictures, avatars and stickers.</li><li>Thumbnails and posters, where a cutout can be layered over text or art.</li><li>Game art: isolate a character or prop, then shrink and recolor it with the <a href="/pixel-art-palette-converter/">pixel art palette converter</a>.</li><li>Design references: pull the colors out of a cutout with the <a href="/image-color-extractor/">image color extractor</a>, then build a scheme with the <a href="/color-palette-generator/">color palette generator</a>.</li></ul>',
      "<h2>Getting better results</h2><ul><li>Photos with clear contrast between subject and background work best, especially in even light.</li><li>Use Best quality for hair, fur and fine edges. Fast is fine for simple objects.</li><li>The model picks the most prominent subject. If a photo has several people or objects, crop to the one you want first.</li><li>Glass, smoke and other see-through objects are hard for any automatic tool, and edges can be soft when the subject and background are close in color.</li><li>If a result looks wrong, try the other model. They make different mistakes.</li></ul>",
    ],
    accent: "#76e068",
    adAfter: 1,
    blurb: "Cut out any image background, privately.",
    cat: "tools",
    description:
      "Remove the background from any image and download a transparent PNG. The AI runs in your browser, so photos are never uploaded. Free, no sign-up, no watermark.",
    faq: [
      [
        "Is my image uploaded anywhere?",
        "No. The model runs in your browser and your image stays on your device. The only download is the model itself, from Tinkerbin's own hosting.",
      ],
      [
        "Why does the first run download so much?",
        "The AI model and the engine that runs it are large: about 61 MB for Best quality and 19 MB for Fast. They are saved in your browser, so later runs skip the download. Clearing the site's data removes them.",
      ],
      [
        "How long does it take?",
        "It runs on your device's processor, so it depends on the device. Best quality typically takes a few seconds to half a minute on a computer, and Fast is quicker. Phones are slower, which is why Fast is the default there.",
      ],
      [
        "Is there a watermark or a limit on uses?",
        "No watermark, no account and no usage limit.",
      ],
      [
        "Which browsers work?",
        "Current Chrome, Edge, Firefox and Safari. The tool needs WebAssembly and module Web Workers, and it tells you if your browser does not support them.",
      ],
      [
        "Why are the edges rough?",
        "Try Best quality, use a larger image, or a photo with more contrast between the subject and background. For fine hair or fur you may want to touch up the result in an image editor.",
      ],
    ],
    features: [
      "Removes image backgrounds automatically with an AI model",
      "Runs in the browser, images are not uploaded",
      "Transparent PNG download",
      "Before and after comparison slider",
    ],
    h1: "Background remover",
    how: [
      "Choose Upload Image, drop a PNG, JPG or WebP on the box, or paste an image.",
      "Wait while the model loads. The first time it downloads about 61 MB, which your browser then keeps for next time.",
      "Drag the slider to compare the original and the result, or switch to side by side. Preview the cutout on white, black or green.",
      "Press Download PNG. The file keeps its transparency.",
    ],
    lede: "Remove the background from any photo and download a transparent PNG. The AI model runs in your browser, so your image never leaves your device.",
    minH: 480,
    name: "Background Remover",
    related: [
      "image-color-extractor",
      "pixel-art-palette-converter",
      "color-palette-generator",
      "pixel-palette-generator",
    ],
    schema: "MultimediaApplication",
    slug: "background-remover",
    title: "Free Background Remover: Remove Image Background Online",
  },
] satisfies readonly ToolContent[];

export const tools = EXPS.map((experience) => ({
  ...experience,
  path: `/${experience.slug}/`,
}));
export const bySlug: Record<string, ToolContent> = Object.fromEntries(
  EXPS.map((experience) => [experience.slug, experience])
);
