// About / Privacy / Terms / Contact copy. Text is written to match what the site actually does.
// Dynamic values come from validated build-time config and are escaped before entering trusted static HTML.
export type LegalSlug = "about" | "privacy" | "terms" | "contact";
export interface LegalPageData {
  title: string;
  h1: string;
  description: string;
  html: string;
  noindex?: boolean;
}
export interface LegalOptions {
  CONTACT_EMAIL: string;
  adsOn: boolean;
  ANALYTICS: { provider: "none" | "cloudflare" | "plausible" | "goatcounter" };
  esc: (value: string) => string;
}

const providerNames = {
  cloudflare: "Cloudflare Web Analytics",
  goatcounter: "GoatCounter",
  plausible: "Plausible Analytics",
} as const;

export function legalPages({
  CONTACT_EMAIL,
  adsOn,
  ANALYTICS,
  esc,
}: LegalOptions): Record<LegalSlug, LegalPageData> {
  const analytics = ANALYTICS.provider && ANALYTICS.provider !== "none";
  const providerName =
    ANALYTICS.provider === "none" ? "" : providerNames[ANALYTICS.provider];
  const updated = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const mail = CONTACT_EMAIL
    ? `<a href="mailto:${esc(CONTACT_EMAIL)}">${esc(CONTACT_EMAIL)}</a>`
    : null;

  return {
    about: {
      description:
        "Tinkerbin is a small independent toolbox of free creative tools: background remover, color palettes, image color extraction and pixel art conversion. They run in your browser.",
      h1: "About Tinkerbin",
      html: `<p>Tinkerbin is a small, independent toolbox of practical creative tools. Each one does one job, opens instantly, needs no account, and runs in your browser.</p>
<h2>The tools</h2>
<ul><li><a href="/background-remover/">Background remover</a>: cut the background out of a photo with an AI model and download a transparent PNG.</li>
<li><a href="/image-color-extractor/">Image color extractor</a>: pull the dominant colors out of any picture.</li>
<li><a href="/color-palette-generator/">Color palette generator</a>: harmonious palettes with contrast checks and export.</li>
<li><a href="/pixel-palette-generator/">Pixel palette generator</a>: hue-shifted color ramps for pixel art.</li>
<li><a href="/pixel-art-palette-converter/">Pixel art palette converter</a>: turn an image into pixel art in a chosen palette.</li></ul>
<h2>Why it exists</h2><p>Many small online tools ask you to upload your files to a server, show a wall of ads or hide basic features behind a sign-up. Tinkerbin aims to be the opposite: fast, honest about how it works, and respectful of your files. The image tools process images on your own device, and the <a href="/privacy/">privacy page</a> explains exactly what is and is not collected.</p>
<h2>How it is built</h2><p>Tinkerbin is a static website: there is no account system, no database and no server that receives your images. Tools load only when you open them, and the background remover downloads its AI model only after you choose an image.</p>
<h2>How it pays for itself</h2><p>Tinkerbin is free to use. It may show a small number of clearly labelled ads in the future to cover hosting and development time. Ads are never placed next to a tool's buttons.</p>
<h2>Credits</h2><p>The background remover uses ONNX Runtime Web (MIT license) with the IS-Net model from the DIS project and the U²-Net-P model from the U²-Net project, both Apache-2.0 licensed and distributed through the rembg project. Full notices are in <a href="/third-party-licenses.txt">third-party-licenses.txt</a>. The PICO-8 palette comes from the PICO-8 fantasy console by Lexaloffle, and Sweetie 16 is by GrafxKid. The display typeface is Pixelify Sans under the SIL Open Font License.</p>
<h2>Get in touch</h2><p>Bug reports, ideas and corrections are welcome on the <a href="/contact/">contact page</a>.</p>`,
      title: "About Tinkerbin: Free Creative Tools in Your Browser",
    },

    contact: {
      description:
        "Contact Tinkerbin to report a bug, suggest a tool, correct a credit or ask a question.",
      h1: "Contact",
      html: mail
        ? `<p>Tinkerbin is an independent project, so replies can take a few days, but every message is read.</p>
<p><strong>Email:</strong> ${mail}</p>
<h2>Good things to write about</h2><ul><li>A bug: include the page, your device and browser, and what happened. Please do not attach private images.</li><li>An idea for a tool or an improvement.</li><li>A correction to a credit or license notice.</li><li>Partnerships or sponsorship.</li></ul>
<h2>Privacy requests</h2><p>Tinkerbin has no accounts and does not store personal data on a server, so there is normally nothing to delete. You can remove everything it saved on your device by clearing this site's data in your browser. See the <a href="/privacy/">privacy policy</a>.</p>`
        : `<p class="notice" role="status">This site does not have a contact address configured yet. The site owner needs to set the <code>CONTACT_EMAIL</code> setting and rebuild before launch (see DEPLOY.md). No message can be sent from this page.</p>`,
      noindex: !CONTACT_EMAIL,
      title: "Contact Tinkerbin",
    },

    privacy: {
      description:
        "How Tinkerbin handles data: image tools run in your browser and never upload your images, what is stored on your device, and what analytics and ads may collect.",
      h1: "Privacy policy",
      html: `<p>Last updated: ${updated}. This page describes what Tinkerbin actually does. If the way the site works changes, this page will be updated first.</p>
<h2>Your images</h2>
<p>The image tools (background remover, image color extractor, pixel art palette converter) run entirely in your browser. When you choose or drop an image, your browser reads it into memory on your device and the processing happens there. The image is <strong>not uploaded</strong> to Tinkerbin or to any third party, and Tinkerbin has no server that could receive it. Closing or reloading the page discards it.</p>
<p>The background remover needs an AI model to work. The first time you use it, your browser downloads the model and a small runtime (about 19 MB for Fast, about 61 MB for Best quality) from the same website that serves this page. They are saved in your browser's cache storage so later runs are faster. They contain no information about you, and clearing this site's data in your browser removes them.</p>
<h2>What is stored on your device</h2>
<ul><li><strong>Model files</strong> for the background remover, in your browser's Cache API, as described above.</li>
<li><strong>One preference</strong>, your choice of Best quality or Fast model, in local storage.</li></ul>
<p>Tinkerbin itself does not set cookies. Nothing stored by Tinkerbin leaves your device.</p>
<h2>Analytics</h2>${analytics ? `<p>Tinkerbin uses ${esc(providerName)}, a privacy-focused analytics service, to count page views and how often features are used, for example when a background removal finishes. Events never include your image, its content or its file name. Tinkerbin honors the Do Not Track and Global Privacy Control signals: if your browser sends either one, analytics is not loaded.</p>` : `<p>At the time of writing, Tinkerbin does not run analytics. If a privacy-focused analytics service is added, this page will be updated to name it and describe what it counts. Tinkerbin will honor the Do Not Track and Global Privacy Control signals.</p>`}
<h2>Advertising</h2>${adsOn ? `<p>Tinkerbin shows ads served by Google AdSense. Google and its partners may use cookies and similar technologies to serve and measure ads and, where permitted, to personalize them. Where required by law, such as in the European Economic Area, the United Kingdom and Switzerland, you will be asked for consent first. Ads load in addition to Tinkerbin's own content and never receive your images. Learn more at <a href="https://policies.google.com/technologies/partner-sites" rel="external noopener">policies.google.com/technologies/partner-sites</a> and manage your preferences at <a href="https://adssettings.google.com" rel="external noopener">adssettings.google.com</a>.</p>` : `<p>Tinkerbin does not currently show ads. If advertising is added, this page will be updated to explain which providers are used, what they collect and how you can opt out, before ads appear.</p>`}
<h2>Third-party requests</h2><p>Tinkerbin's scripts, fonts, images and AI models are all served from its own hosting. Apart from the analytics and advertising services described above, if enabled, pages do not load code or fonts from other sites.</p>
<h2>Hosting and logs</h2><p>Tinkerbin is delivered by a static hosting provider, which may keep standard server logs such as IP addresses, requested pages and timestamps for security and operations. Tinkerbin does not receive or use those logs to identify individual visitors.</p>
<h2>Email</h2><p>If you email Tinkerbin, the message and your address are used only to read and answer it.</p>
<h2>Children</h2><p>Tinkerbin is a general audience site and is not directed at children under 13. It does not knowingly collect personal information from anyone.</p>
<h2>Contact</h2><p>${mail ? `Questions about this policy: ${mail}.` : 'Questions about this policy can be sent using the details on the <a href="/contact/">contact page</a>.'}</p>`,
      title: "Privacy Policy | Tinkerbin",
    },

    terms: {
      description:
        "The simple rules for using Tinkerbin: free to use, you keep your images and results, no warranties, and please use the tools responsibly.",
      h1: "Terms of use",
      html: `<p>Last updated: ${updated}. By using this website you agree to these terms. They are short on purpose.</p>
<h2>Using the site</h2><p>Tinkerbin and its tools are free for personal and commercial use. Please do not attempt to disrupt the site, overload it with automated requests, probe it for weaknesses without permission, or use it to break the law or infringe other people's rights.</p>
<h2>Your images and results</h2><p>You keep all rights to the images you load and to the results you create, including cutouts, palettes and converted images, and no attribution is required. You are responsible for having the right to use the images you process. The tools run in your browser and Tinkerbin does not receive your images; see the <a href="/privacy/">privacy policy</a>.</p>
<h2>What belongs to Tinkerbin</h2><p>The site's design, code, pixel art, text and branding belong to its creator. Third-party software, models, palettes and fonts remain the property of their authors and are used under their licenses; see the <a href="/about/">about page</a> and <a href="/third-party-licenses.txt">third-party-licenses.txt</a>.</p>
<h2>Results may be imperfect</h2><p>Automatic tools, including the AI background remover, make mistakes. Check results before you rely on them, especially for professional or commercial work.</p>
<h2>No warranty</h2><p>Tinkerbin is provided "as is" and "as available" without warranties of any kind, including fitness for a particular purpose and uninterrupted or error-free operation. The site may change, break or disappear at any time. To the maximum extent permitted by law, the creator is not liable for any loss or damage arising from your use of the site.</p>
<h2>Third-party links</h2><p>Tinkerbin may link to other websites, which have their own terms and policies. Tinkerbin is not responsible for them.</p>
<h2>Changes</h2><p>These terms may be updated. The date above shows when they last changed, and continued use means you accept the current version.</p>
<h2>Contact</h2><p>${mail ? `Questions about these terms: ${mail}.` : 'Questions about these terms can be sent using the details on the <a href="/contact/">contact page</a>.'}</p>`,
      title: "Terms of Use | Tinkerbin",
    },
  };
}
