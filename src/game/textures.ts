import * as THREE from 'three';

function canvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) throw new Error('2d context unavailable');
  return [c, g];
}

function tex(c: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.repeat.set(repeatX, repeatY);
  return t;
}

export function woodTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512);
  g.fillStyle = '#c4844e';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 3) {
    const n = 0.5 + 0.5 * Math.sin(y * 0.17) * Math.sin(y * 0.04 + 2);
    g.strokeStyle = `rgba(92, 42, 18, ${0.05 + n * 0.16})`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 12) {
      g.lineTo(x, y + Math.sin(x * 0.05 + y * 0.2) * 1.6);
    }
    g.stroke();
  }
  g.strokeStyle = 'rgba(58, 24, 10, 0.55)';
  g.lineWidth = 4;
  for (let x = 0; x < 512; x += 128) {
    g.beginPath();
    g.moveTo(x + 2, 0);
    g.lineTo(x + 2, 512);
    g.stroke();
    g.strokeStyle = 'rgba(255, 220, 180, 0.12)';
    g.beginPath();
    g.moveTo(x + 6, 0);
    g.lineTo(x + 6, 512);
    g.stroke();
    g.strokeStyle = 'rgba(58, 24, 10, 0.55)';
  }
  return tex(c, 4, 3);
}

export function dialTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512);
  g.fillStyle = '#f4d7a6';
  g.fillRect(0, 0, 512, 512);
  const cx = 256;
  const cy = 256;
  g.strokeStyle = '#c4a06a';
  g.lineWidth = 3;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const inner = i % 5 === 0 ? 196 : 214;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    g.lineTo(cx + Math.cos(a) * 236, cy + Math.sin(a) * 236);
    g.stroke();
  }
  g.fillStyle = '#e7b85a';
  g.beginPath();
  g.arc(cx, cy, 10, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#8a5a2a';
  g.font = '600 28px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('12', cx, 78);
  return tex(c);
}

export function rugTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512);
  g.fillStyle = '#ef6a3c';
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#f2c14a';
  for (let y = 40; y < 480; y += 64) {
    for (let x = 40; x < 480; x += 64) {
      g.beginPath();
      g.moveTo(x, y - 16);
      g.lineTo(x + 16, y);
      g.lineTo(x, y + 16);
      g.lineTo(x - 16, y);
      g.closePath();
      g.fill();
    }
  }
  g.strokeStyle = '#2f6f8f';
  g.lineWidth = 18;
  g.strokeRect(16, 16, 480, 480);
  g.strokeStyle = '#fff3e0';
  g.lineWidth = 4;
  g.strokeRect(34, 34, 444, 444);
  return tex(c);
}

export function posterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 420;
  const g = c.getContext('2d');
  if (!g) throw new Error('2d context unavailable');
  const sky = g.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, '#ffb25e');
  sky.addColorStop(0.45, '#ef6d7a');
  sky.addColorStop(1, '#3a4d8f');
  g.fillStyle = sky;
  g.fillRect(0, 0, 320, 420);
  g.fillStyle = '#ffe7a8';
  g.beginPath();
  g.arc(210, 120, 48, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1f6a58';
  g.beginPath();
  g.moveTo(0, 300);
  g.lineTo(80, 230);
  g.lineTo(150, 280);
  g.lineTo(230, 200);
  g.lineTo(320, 270);
  g.lineTo(320, 420);
  g.lineTo(0, 420);
  g.fill();
  g.fillStyle = '#143e36';
  g.fillRect(0, 340, 320, 80);
  return tex(c);
}

export function nightTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512);
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#14243f');
  sky.addColorStop(1, '#3d6d92');
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#f4f0d8';
  g.beginPath();
  g.arc(340, 150, 46, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#3d6d92';
  g.beginPath();
  g.arc(358, 138, 40, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff8e8';
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 360;
    g.fillRect(x, y, 2, 2);
  }
  return tex(c);
}

export function noteTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(256);
  g.fillStyle = '#f6e7c1';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#e2d0a4';
  g.lineWidth = 2;
  for (let y = 48; y < 240; y += 28) {
    g.beginPath();
    g.moveTo(20, y);
    g.lineTo(236, y);
    g.stroke();
  }
  g.fillStyle = '#5c3b22';
  g.font = 'italic 42px Georgia, serif';
  g.textAlign = 'center';
  g.fillText('look closer', 128, 140);
  return tex(c);
}

export function oxidationTexture(): THREE.CanvasTexture {
  const [c, g] = canvas(512);
  g.fillStyle = '#12383f';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1400; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 12345.678) % 1;
    const px = Math.abs(x) * 512;
    const py = Math.abs(y) * 512;
    const hue = i % 5;
    const colors = ['#1d6e66', '#0e2c36', '#6a3c78', '#b85a78', '#c9a15a'];
    g.fillStyle = colors[hue] ?? '#1d6e66';
    g.globalAlpha = 0.35;
    g.beginPath();
    g.arc(px, py, 8 + (i % 18), 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  return tex(c, 3, 3);
}
