/**
 * Builds a real 3D creature (GLB) from a Pet's 2D Appearance genome.
 * This is the bridge between the pet you raise in the app and the pet
 * that stands on your desk in AR: the same genome, two embodiments.
 *
 * Client-only: ArViewer loads this module with a dynamic import inside
 * a useEffect, so `three` never touches the server bundle.
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { Appearance, BodyShape } from "./api";

type Vec3 = [number, number, number];

function std(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.85,
    metalness: 0,
  });
}

export async function buildCreatureGLB(
  appearance: Appearance,
): Promise<string> {
  const creature = new THREE.Group();
  const a = appearance;
  const SIZE_SCALE: Record<string, number> = {
    tiny: 0.7,
    small: 1.0,
    medium: 1.3,
  };
  const s = THREE.MathUtils.clamp(SIZE_SCALE[a.size] ?? 1.0, 0.6, 1.4);

  const add = (
    geo: THREE.BufferGeometry,
    color: string,
    pos: Vec3,
    opts?: { scale?: Vec3; rot?: Vec3 },
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, std(color));
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (opts?.scale)
      mesh.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
    if (opts?.rot) mesh.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
    creature.add(mesh);
    return mesh;
  };

  /* ---- Body ---- */
  if (a.body_shape === "robot") {
    add(new THREE.BoxGeometry(1.5, 1.5, 1.3), a.base_color, [0, 1.0, 0]);
    add(new THREE.BoxGeometry(0.7, 0.5, 0.06), a.accent_color, [0, 0.85, 0.66]);
  } else {
    const scales: Record<Exclude<BodyShape, "robot">, Vec3> = {
      blob: [1, 0.95, 0.9],
      round: [1, 1, 1],
      long: [1.45, 0.8, 0.85],
      dragon: [1, 0.92, 0.88],
      cat: [1, 0.95, 0.92],
    };
    add(new THREE.SphereGeometry(1, 40, 28), a.base_color, [0, 1.0, 0], {
      scale: scales[a.body_shape],
    });
  }

  // Belly patch (front, +Z)
  add(new THREE.SphereGeometry(0.62, 28, 20), a.belly_color, [0, 0.88, 0.6], {
    scale: [1, 1.15, 0.55],
  });

  /* ---- Eyes (front upper, +Z) ---- */
  const eyeY = 1.38;
  const eyeX = 0.34;
  const eyeZ = 0.8;
  const dark = "#1f2937";
  if (a.eye_style === "happy") {
    for (const side of [-1, 1]) {
      add(new THREE.TorusGeometry(0.1, 0.028, 8, 18, Math.PI), dark, [
        side * eyeX,
        eyeY,
        eyeZ,
      ]);
    }
  } else if (a.eye_style === "sleepy") {
    for (const side of [-1, 1]) {
      add(
        new THREE.SphereGeometry(0.16, 20, 14),
        "#ffffff",
        [side * eyeX, eyeY, eyeZ],
        {
          scale: [1, 0.28, 0.6],
        },
      );
      add(
        new THREE.SphereGeometry(0.06, 14, 10),
        dark,
        [side * eyeX, eyeY - 0.02, eyeZ + 0.09],
        {
          scale: [1, 0.4, 0.6],
        },
      );
    }
  } else {
    for (const side of [-1, 1]) {
      add(new THREE.SphereGeometry(0.17, 24, 18), "#ffffff", [
        side * eyeX,
        eyeY,
        eyeZ,
      ]);
      add(new THREE.SphereGeometry(0.075, 18, 14), dark, [
        side * eyeX,
        eyeY + 0.02,
        eyeZ + 0.12,
      ]);
      add(new THREE.SphereGeometry(0.028, 10, 8), "#ffffff", [
        side * eyeX - 0.03,
        eyeY + 0.06,
        eyeZ + 0.17,
      ]);
      if (a.eye_style === "starry") {
        add(new THREE.OctahedronGeometry(0.05), "#fbbf24", [
          side * eyeX + 0.22,
          eyeY + 0.2,
          eyeZ + 0.05,
        ]);
      }
    }
  }

  // Blush
  for (const side of [-1, 1]) {
    add(
      new THREE.SphereGeometry(0.09, 14, 10),
      "#f9a8d4",
      [side * 0.56, 1.08, 0.7],
      {
        scale: [1, 0.6, 0.4],
      },
    );
  }

  /* ---- Features ---- */
  if (a.features.includes("wings")) {
    for (const side of [-1, 1]) {
      add(
        new THREE.ConeGeometry(0.5, 1.25, 3),
        a.accent_color,
        [side * 1.0, 1.45, -0.2],
        {
          scale: [0.28, 1, 1],
          rot: [0, 0, side * -0.55],
        },
      );
    }
  }
  if (a.features.includes("horns")) {
    for (const side of [-1, 1]) {
      add(
        new THREE.ConeGeometry(0.14, 0.5, 12),
        a.belly_color,
        [side * 0.42, 2.0, 0.05],
        {
          rot: [0, 0, side * -0.3],
        },
      );
    }
  }
  if (a.features.includes("antenna")) {
    add(
      new THREE.CylinderGeometry(0.03, 0.03, 0.6, 10),
      "#94a3b8",
      [0, 2.0, 0],
    );
    add(new THREE.SphereGeometry(0.09, 14, 10), a.accent_color, [0, 2.34, 0]);
  }
  if (a.features.includes("ears")) {
    for (const side of [-1, 1]) {
      add(
        new THREE.ConeGeometry(0.24, 0.6, 4),
        a.base_color,
        [side * 0.55, 1.95, 0],
        {
          rot: [0, 0, side * -0.28],
        },
      );
    }
  }
  if (a.features.includes("tail")) {
    add(
      new THREE.TorusGeometry(0.42, 0.11, 10, 22, Math.PI * 1.25),
      a.base_color,
      [0, 0.75, -0.8],
      { rot: [0.4, Math.PI / 2, 0.6] },
    );
  }

  /* ---- Accessories ---- */
  if (a.accessories.includes("scarf")) {
    add(
      new THREE.TorusGeometry(0.8, 0.17, 12, 36),
      a.accent_color,
      [0, 0.5, 0],
      {
        rot: [Math.PI / 2, 0, 0],
      },
    );
  }
  if (a.accessories.includes("hat")) {
    add(
      new THREE.ConeGeometry(0.45, 0.75, 18),
      a.accent_color,
      [0.18, 2.3, 0],
      {
        rot: [0, 0, -0.18],
      },
    );
    add(new THREE.SphereGeometry(0.11, 12, 10), "#ffffff", [0.32, 2.68, 0]);
  }
  if (a.accessories.includes("bow")) {
    for (const side of [-1, 1]) {
      add(
        new THREE.SphereGeometry(0.16, 14, 10),
        a.accent_color,
        [0.62 + side * 0.17, 1.78, 0.28],
        {
          scale: [1, 0.7, 0.5],
          rot: [0, 0, side * 0.5],
        },
      );
    }
    add(
      new THREE.SphereGeometry(0.09, 12, 10),
      a.accent_color,
      [0.62, 1.78, 0.3],
    );
  }
  if (a.accessories.includes("glasses")) {
    for (const side of [-1, 1]) {
      add(new THREE.TorusGeometry(0.17, 0.032, 10, 28), dark, [
        side * eyeX,
        eyeY,
        eyeZ + 0.1,
      ]);
    }
    add(
      new THREE.CylinderGeometry(0.025, 0.025, 0.24, 8),
      dark,
      [0, eyeY + 0.02, eyeZ + 0.1],
      {
        rot: [0, 0, Math.PI / 2],
      },
    );
  }

  creature.scale.setScalar(s);

  const exporter = new GLTFExporter();
  const buffer = (await exporter.parseAsync(creature, {
    binary: true,
  })) as ArrayBuffer;

  // Free geometry/material memory — we only need the exported bytes.
  creature.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const material = mesh.material as
      | THREE.Material
      | THREE.Material[]
      | undefined;
    if (Array.isArray(material)) {
      for (const m of material) m.dispose();
    } else {
      material?.dispose();
    }
  });

  return URL.createObjectURL(new Blob([buffer], { type: "model/gltf-binary" }));
}

/** Release an object URL created by buildCreatureGLB. */
export function revokeCreatureGLB(url: string): void {
  URL.revokeObjectURL(url);
}
