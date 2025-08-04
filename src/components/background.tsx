'use client';

import { useEffect, useRef } from "react";
import p5 from "p5";

const Background: React.FC = () => {
    const canvasContainer = useRef<HTMLDivElement>(null);
    const sketchInstance = useRef<p5 | null>(null);

    useEffect(() => {
        let p5Instance: p5 | null = null;

        const createSketch = async () => {
            const p5 = (await import("p5")).default;

            const sketch = (p: p5) => {
                interface Dot {
                    x: number;
                    y: number;
                    direction: number;
                }
                const dots: Dot[] = [];
                const dotCount = 100;
                let fade_in = 0;

                p.setup = () => {
                    p.createCanvas(p.windowWidth, p.windowHeight);
                    p.background(0);

                    for (let i = 0; i < dotCount; i++) {
                        dots.push({
                            x: p.random(p.width),
                            y: p.random(p.height),
                            direction: p.random(360)
                        });
                    }
                };

                p.draw = () => {
                    fade_in += 0.25;
                    
                    p.background(0, 20); // Fade effect
                    p.stroke("#61892F");
                    p.strokeWeight(p.min(fade_in, 8));
                    for (const dot of dots) {
                        const angle = p.radians(dot.direction);
                        dot.x += p.cos(angle) * 2; // Move in the direction
                        dot.y += p.sin(angle) * 2;
                        dot.direction += 0.3; // Slightly change direction
                    
                        // Wrap around the edges
                        if (dot.x < 0) dot.x = p.width;
                        if (dot.x > p.width) dot.x = 0;
                        if (dot.y < 0) dot.y = p.height;
                        if (dot.y > p.height) dot.y = 0;
                        p.point(dot.x, dot.y);
                    }
                };

                p.windowResized = () => {
                    p.resizeCanvas(p.windowWidth, p.windowHeight);
                };
            };

            if (canvasContainer.current) {
                p5Instance = new p5(sketch, canvasContainer.current);
                sketchInstance.current = p5Instance;
            }
        };

        createSketch();

        return () => {
            if (sketchInstance.current) {
                sketchInstance.current.remove();
                sketchInstance.current = null;
            }
        };
    }, []);

    return (
        <>
            <style jsx global>{`
                body {
                    margin: 0;
                }
            `}</style>
            <div
                ref={canvasContainer}
                className="background-canvas"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: -1,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                }}
            />
        </>
    );
};

export default Background;