"""Compress IS-Net (DIS, Apache-2.0, as packaged by rembg) for the browser.

Weights-only, per-channel int8 quantization of every Conv weight, stored with
DequantizeLinear nodes. ONNX Runtime constant-folds those back to float32 at load,
so activations stay float32 (accuracy is essentially unchanged: IoU 0.9999 vs fp32
on test photos) while the download shrinks from 178 MB to ~47 MB.
The graph has 1024x1024 baked into its Resize nodes, so the model runs at 1024 only.

  pip install onnx numpy
  curl -L -o isnet-general-use.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
  python3 tools/quantize_isnet.py isnet-general-use.onnx models/isnet-general-use.q8.onnx
"""
import sys, numpy as np, onnx
from onnx import numpy_helper, helper

def main(src, dst):
    m = onnx.load(src)
    for o in m.opset_import:
        if o.domain in ('', 'ai.onnx') and o.version < 13:
            o.version = 13
    inits = {i.name: i for i in m.graph.initializer}
    nodes_new, inits_new, drop = [], [], set()
    for n in m.graph.node:
        if n.op_type == 'Conv' and n.input[1] in inits and np.prod(inits[n.input[1]].dims) >= 64:
            name = n.input[1]
            w = numpy_helper.to_array(inits[name]).astype(np.float32)
            flat = w.reshape(w.shape[0], -1)
            sc = np.maximum(np.abs(flat).max(1), 1e-8) / 127.0
            q = np.clip(np.round(flat / sc[:, None]), -127, 127).astype(np.int8).reshape(w.shape)
            inits_new += [numpy_helper.from_array(q, name + '_q'),
                          numpy_helper.from_array(sc.astype(np.float32), name + '_s'),
                          numpy_helper.from_array(np.zeros(w.shape[0], np.int8), name + '_z')]
            nodes_new.append(helper.make_node('DequantizeLinear', [name + '_q', name + '_s', name + '_z'], [name + '_dq'], axis=0, name=name + '_dqn'))
            n.input[1] = name + '_dq'
            drop.add(name)
    keep = [i for i in m.graph.initializer if i.name not in drop]
    del m.graph.initializer[:]; m.graph.initializer.extend(keep + inits_new)
    rest = list(m.graph.node); del m.graph.node[:]; m.graph.node.extend(nodes_new + rest)
    onnx.checker.check_model(m)
    onnx.save(m, dst)

if __name__ == '__main__':
    main(*sys.argv[1:3])
