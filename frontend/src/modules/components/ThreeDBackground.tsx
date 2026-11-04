import React, { useEffect, useRef } from 'react';
import { UserRole } from '../state/AuthContext';

interface ThreeDBackgroundProps {
    role: UserRole;
    mousePos?: { x: number; y: number };
}

interface Particle3D {
    x: number;
    y: number;
    z: number;
    baseX: number;
    baseY: number;
    baseZ: number;
    vx: number;
    vy: number;
    vz: number;
    radius: number;
    colorIndex: number;
    pulseSpeed: number;
    pulsePhase: number;
}

interface WireframeNode {
    x: number;
    y: number;
    z: number;
}

export const ThreeDBackground: React.FC<ThreeDBackgroundProps> = ({ role }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
    });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            // Normalized coords [-1, 1]
            mouseRef.current.targetX = (e.clientX / width) * 2 - 1;
            mouseRef.current.targetY = (e.clientY / height) * 2 - 1;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        // 3D Particles Configuration
        const PARTICLE_COUNT = 160;
        const particles: Particle3D[] = [];
        const SPHERE_RADIUS = Math.min(width, height) * 0.42;

        // Initialize particles distributed on a 3D spherical shell / orbital volume
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
            const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;

            const r = SPHERE_RADIUS * (0.6 + Math.random() * 0.55);
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            particles.push({
                x,
                y,
                z,
                baseX: x,
                baseY: y,
                baseZ: z,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                vz: (Math.random() - 0.5) * 0.4,
                radius: 1.5 + Math.random() * 2.5,
                colorIndex: Math.floor(Math.random() * 3),
                pulseSpeed: 0.02 + Math.random() * 0.03,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }

        // Geometric 3D Cube Nodes for Hologram Layer
        const cubeNodes: WireframeNode[] = [];
        const CUBE_SIZE = 140;
        for (let cx = -1; cx <= 1; cx += 2) {
            for (let cy = -1; cy <= 1; cy += 2) {
                for (let cz = -1; cz <= 1; cz += 2) {
                    cubeNodes.push({
                        x: cx * CUBE_SIZE,
                        y: cy * CUBE_SIZE,
                        z: cz * CUBE_SIZE
                    });
                }
            }
        }

        const cubeEdges = [
            [0, 1], [1, 3], [3, 2], [2, 0], // front/back faces
            [4, 5], [5, 7], [7, 6], [6, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
        ];

        let rotX = 0;
        let rotY = 0;
        let rotZ = 0;
        const FOV = 650;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            // Interpolate mouse coordinates smoothly
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

            // Rotation increments with mouse influence
            rotY += 0.0035 + mouseRef.current.x * 0.004;
            rotX += 0.002 + mouseRef.current.y * 0.003;
            rotZ += 0.001;

            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const cosX = Math.cos(rotX);
            const sinX = Math.sin(rotX);
            const cosZ = Math.cos(rotZ);
            const sinZ = Math.sin(rotZ);

            const centerX = width / 2;
            const centerY = height / 2;

            // Theme color setup based on Role
            const isStudent = role === 'student';
            const primaryColor = isStudent ? 'rgba(56, 189, 248,' : 'rgba(168, 85, 247,'; // Cyan vs Purple
            const secondaryColor = isStudent ? 'rgba(52, 211, 153,' : 'rgba(236, 72, 153,'; // Emerald vs Pink
            const accentColor = isStudent ? 'rgba(99, 102, 241,' : 'rgba(139, 92, 246,'; // Indigo vs Violet

            // 1. Draw 3D Hologram Cube Wireframe in the Center
            const projectedCubeNodes: { x2d: number; y2d: number; z: number }[] = [];
            for (let i = 0; i < cubeNodes.length; i++) {
                const node = cubeNodes[i];
                // Rotate
                let x1 = node.x * cosY + node.z * sinY;
                let z1 = -node.x * sinY + node.z * cosY;
                let y1 = node.y * cosX - z1 * sinX;
                let z2 = node.y * sinX + z1 * cosX;

                let x3 = x1 * cosZ - y1 * sinZ;
                let y3 = x1 * sinZ + y1 * cosZ;

                const scale = FOV / (FOV + z2 + 200);
                projectedCubeNodes.push({
                    x2d: centerX + x3 * scale,
                    y2d: centerY + y3 * scale,
                    z: z2
                });
            }

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = `${primaryColor} 0.18)`;
            for (let i = 0; i < cubeEdges.length; i++) {
                const [p1, p2] = cubeEdges[i];
                const n1 = projectedCubeNodes[p1];
                const n2 = projectedCubeNodes[p2];
                ctx.beginPath();
                ctx.moveTo(n1.x2d, n1.y2d);
                ctx.lineTo(n2.x2d, n2.y2d);
                ctx.stroke();
            }

            // 2. Project and sort all 3D particles by depth
            interface ProjectedParticle {
                x2d: number;
                y2d: number;
                z: number;
                scale: number;
                alpha: number;
                radius: number;
                color: string;
                rawIndex: number;
            }

            const projectedList: ProjectedParticle[] = [];

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.pulsePhase += p.pulseSpeed;

                // Subtle organic motion
                p.x = p.baseX + Math.sin(p.pulsePhase) * 12;
                p.y = p.baseY + Math.cos(p.pulsePhase) * 12;
                p.z = p.baseZ + Math.sin(p.pulsePhase * 0.7) * 8;

                // 3D Rotation Matrix
                // Y-axis rotation
                let x1 = p.x * cosY + p.z * sinY;
                let z1 = -p.x * sinY + p.z * cosY;
                // X-axis rotation
                let y1 = p.y * cosX - z1 * sinX;
                let z2 = p.y * sinX + z1 * cosX;
                // Z-axis rotation
                let x3 = x1 * cosZ - y1 * sinZ;
                let y3 = x1 * sinZ + y1 * cosZ;

                // Mouse gravitation deflection
                const mouseDistX = (mouseRef.current.x * 200);
                const mouseDistY = (mouseRef.current.y * 200);
                x3 += (mouseDistX * (z2 + SPHERE_RADIUS)) / (SPHERE_RADIUS * 2.5);
                y3 += (mouseDistY * (z2 + SPHERE_RADIUS)) / (SPHERE_RADIUS * 2.5);

                const scale = FOV / (FOV + z2 + 250);
                const x2d = centerX + x3 * scale;
                const y2d = centerY + y3 * scale;

                // Depth-based opacity & size
                const depthFactor = (z2 + SPHERE_RADIUS) / (SPHERE_RADIUS * 2);
                const alpha = Math.max(0.12, Math.min(0.95, depthFactor * 0.9 + 0.1));

                let color = primaryColor;
                if (p.colorIndex === 1) color = secondaryColor;
                if (p.colorIndex === 2) color = accentColor;

                projectedList.push({
                    x2d,
                    y2d,
                    z: z2,
                    scale,
                    alpha,
                    radius: p.radius * scale * (1 + 0.25 * Math.sin(p.pulsePhase)),
                    color,
                    rawIndex: i
                });
            }

            // Sort from back to front for accurate 3D rendering
            projectedList.sort((a, b) => a.z - b.z);

            // 3. Draw 3D Connecting Neural Lines
            const maxConnectDist = 110;
            ctx.lineWidth = 0.8;
            for (let i = 0; i < projectedList.length; i++) {
                const p1 = projectedList[i];
                for (let j = i + 1; j < projectedList.length; j++) {
                    const p2 = projectedList[j];
                    const dx = p1.x2d - p2.x2d;
                    const dy = p1.y2d - p2.y2d;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxConnectDist) {
                        const lineAlpha = (1 - dist / maxConnectDist) * Math.min(p1.alpha, p2.alpha) * 0.35;
                        ctx.strokeStyle = `${p1.color} ${lineAlpha})`;
                        ctx.beginPath();
                        ctx.moveTo(p1.x2d, p1.y2d);
                        ctx.lineTo(p2.x2d, p2.y2d);
                        ctx.stroke();
                    }
                }
            }

            // 4. Draw Particles with 3D Glowing Halos
            for (let i = 0; i < projectedList.length; i++) {
                const p = projectedList[i];

                // Outer soft halo
                const grad = ctx.createRadialGradient(
                    p.x2d, p.y2d, 0,
                    p.x2d, p.y2d, p.radius * 3.5
                );
                grad.addColorStop(0, `${p.color} ${p.alpha * 0.8})`);
                grad.addColorStop(0.4, `${p.color} ${p.alpha * 0.25})`);
                grad.addColorStop(1, `${p.color} 0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, p.radius * 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Bright core
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(p.x2d, p.y2d, Math.max(0.8, p.radius * 0.6), 0, Math.PI * 2);
                ctx.fill();
            }

            // 5. Draw Floating 3D Concentric Orbit Rings
            const RING_COUNT = 3;
            for (let r = 1; r <= RING_COUNT; r++) {
                const ringRadius = SPHERE_RADIUS * (0.8 + r * 0.22);
                ctx.beginPath();
                for (let a = 0; a <= Math.PI * 2; a += 0.15) {
                    const rx = ringRadius * Math.cos(a);
                    const rz = ringRadius * Math.sin(a);
                    const ry = Math.sin(a * 2 + rotZ * 2) * 20;

                    let x1 = rx * cosY + rz * sinY;
                    let z1 = -rx * sinY + rz * cosY;
                    let y1 = ry * cosX - z1 * sinX;
                    let z2 = ry * sinX + z1 * cosX;

                    const scale = FOV / (FOV + z2 + 250);
                    const x2d = centerX + x1 * scale;
                    const y2d = centerY + y1 * scale;

                    if (a === 0) ctx.moveTo(x2d, y2d);
                    else ctx.lineTo(x2d, y2d);
                }
                ctx.closePath();
                ctx.strokeStyle = `${primaryColor} ${0.08 / r})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [role]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
            style={{ width: '100vw', height: '100vh' }}
        />
    );
};
