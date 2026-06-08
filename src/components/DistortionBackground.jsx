import { useEffect, useRef } from 'react';

/**
 * LiquidDistortionBackground
 * Renders a full-screen canvas behind the auth card.
 * On mouse move the liquid surface distorts around the cursor.
 */
export default function DistortionBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: true });
    if (!gl) return;

    // Track mouse move globally
    const handleGlobalMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);

    // ── Vertex Shader ─────────────────────────────────────────────────────
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // ── Fragment Shader ───────────────────────────────────────────────────
    const fsSource = `
      precision highp float;
      varying vec2 v_uv;

      uniform float u_time;
      uniform vec2  u_mouse;       // normalised [0,1]
      uniform vec2  u_resolution;

      // ── Simplex-style hash noise ──────────────────────────────────────
      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)),
                 dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        float a = dot(hash2(i + vec2(0,0)), f - vec2(0,0));
        float b = dot(hash2(i + vec2(1,0)), f - vec2(1,0));
        float c = dot(hash2(i + vec2(0,1)), f - vec2(0,1));
        float d = dot(hash2(i + vec2(1,1)), f - vec2(1,1));

        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      // ── FBM (fractal brownian motion) ─────────────────────────────────
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2  s = vec2(1.0);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p  = p * 2.0 + 13.7;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = v_uv;

        // ── cursor ripple ─────────────────────────────────────────────
        vec2  m   = u_mouse;
        float d   = distance(uv, m);
        float rad = 0.22;                          // ripple radius
        float str = 0.045 * smoothstep(rad, 0.0, d);
        vec2  dir = normalize(uv - m + 0.0001);
        uv += dir * str * sin(d * 28.0 - u_time * 4.5) * 0.55;

        // ── global liquid warp ────────────────────────────────────────
        float t = u_time * 0.18;
        float q1 = fbm(uv * 2.4 + t);
        float q2 = fbm(uv * 2.4 + vec2(1.0) + t * 1.12);
        float r  = fbm(uv * 2.0 + vec2(q1, q2) + t * 0.7);
        float s2 = fbm(uv * 1.8 + vec2(r, q1) + t * 0.5);

        // ── palette ───────────────────────────────────────────────────
        vec3 col1 = vec3(0.071, 0.075, 0.345);   // #121358
        vec3 col2 = vec3(0.137, 0.184, 0.447);   // #232F72
        vec3 col3 = vec3(0.184, 0.341, 0.541);   // #2F578A
        vec3 col4 = vec3(0.211, 0.678, 0.639);   // #36ADA3

        float mix1 = smoothstep(-0.4, 0.4, r);
        float mix2 = smoothstep(-0.3, 0.5, s2);

        vec3 base = mix(mix(col1, col2, mix1), mix(col3, col4, mix2), 0.5);

        // ── cursor glow (very dim) ────────────────────────────────────
        float glow = exp(-d * 14.0) * 0.012;
        base += vec3(0.211, 0.678, 0.639) * glow;

        // ── subtle grid / shimmer ─────────────────────────────────────
        float grid = smoothstep(0.97, 1.0,
          max(abs(sin(uv.x * 60.0)), abs(sin(uv.y * 60.0))));
        base += vec3(0.184, 0.341, 0.541) * grid * 0.02;

        // ── vignette ─────────────────────────────────────────────────
        vec2 cen = uv - 0.5;
        float vig = 1.0 - dot(cen, cen) * 1.6;
        base *= clamp(vig, 0.0, 1.0);

        gl_FragColor = vec4(base, 1.0);
      }
    `;

    // ── compile shader helper ─────────────────────────────────────────────
    function compileShader(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // ── fullscreen quad ───────────────────────────────────────────────────
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // ── uniform locations ─────────────────────────────────────────────────
    const uTime       = gl.getUniformLocation(prog, 'u_time');
    const uMouse      = gl.getUniformLocation(prog, 'u_mouse');
    const uResolution = gl.getUniformLocation(prog, 'u_resolution');

    // ── resize handling ───────────────────────────────────────────────────
    function resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const startTime = performance.now();

    // ── render loop ───────────────────────────────────────────────────────
    function render() {
      const t = (performance.now() - startTime) / 1000;

      // smooth mouse lerp
      const lerp = 0.07;
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * lerp;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * lerp;

      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouseRef.current.x, 1.0 - mouseRef.current.y);
      gl.uniform2f(uResolution, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
      }}
    />
  );
}
