# Third-party notices

Tinkerbin's Background Remover (`/background-remover/`) runs entirely in the visitor's browser using:

| Component | Use | License |
| --- | --- | --- |
| ONNX Runtime Web (Microsoft) | Runs the models with WebAssembly | MIT (`licenses/onnxruntime-web-MIT.txt`) |
| IS-Net "general use" model, from the DIS project (Xuebin Qin et al.) | Best quality model. Weights are compressed to per-channel int8 by `tools/quantize_isnet.py`; the network is otherwise unchanged | Apache-2.0 (`licenses/Apache-2.0.txt`) |
| U²-Net-P model (Xuebin Qin et al.) | Fast model, used unmodified | Apache-2.0 |
| rembg (Daniel Gatis) | Source of the ONNX exports of both models | MIT |

Sources:

- https://github.com/xuebinqin/DIS
- https://github.com/xuebinqin/U-2-Net
- https://github.com/danielgatis/rembg (release v0.0.0 assets `isnet-general-use.onnx`, `u2netp.onnx`)
- https://github.com/microsoft/onnxruntime

Other assets: Pixelify Sans (SIL Open Font License 1.1, via @fontsource-variable/pixelify-sans).

`npm run build` writes these notices, with the license texts, to `/third-party-licenses.txt`.

Please confirm the license terms of any model you swap in. Models such as BRIA RMBG and similar are often non-commercial, and `@imgly/background-removal` is AGPL-3.0, which is why neither is used here.
