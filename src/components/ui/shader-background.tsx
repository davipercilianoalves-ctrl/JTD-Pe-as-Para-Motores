import React, { useEffect, useRef } from 'react';

export const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const vsSource = `
    attribute vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 iResolution;
    uniform float iTime;

    void main() {
      vec2 uv = gl_FragCoord.xy / iResolution.xy;
      
      float t = iTime * 0.3;
      
      vec3 col = vec3(0.0);
      
      // Glow laranja automotivo
      float glow1 = 0.3 / length(uv - vec2(0.3 + sin(t) * 0.1, 0.5));
      float glow2 = 0.2 / length(uv - vec2(0.7 + cos(t * 0.7) * 0.1, 0.4));
      float glow3 = 0.15 / length(uv - vec2(0.5, 0.7 + sin(t * 0.5) * 0.1));
      
      col += vec3(1.0, 0.4, 0.0) * glow1 * 0.4;
      col += vec3(0.8, 0.3, 0.0) * glow2 * 0.3;
      col += vec3(1.0, 0.6, 0.0) * glow3 * 0.2;
      
      col = clamp(col, 0.0, 1.0);
      
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const loadShader = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vs = loadShader(gl.VERTEX_SHADER, vsSource);
    const fs = loadShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 1,-1, -1,1, 1,1
    ]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'aVertexPosition');
    const resLoc = gl.getUniformLocation(program, 'iResolution');
    const timeLoc = gl.getUniformLocation(program, 'iTime');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    let start = Date.now();
    let rafId: number;
    const render = () => {
      const t = (Date.now() - start) / 1000;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(pos);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 h-full w-full pointer-events-none opacity-40"
    />
  );
};
