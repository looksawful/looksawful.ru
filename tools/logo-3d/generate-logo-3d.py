import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path

import bpy
import bmesh


def cli_args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate canonical 3D logos from SVG sources")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--manifest", type=Path, default=Path("tools/logo-3d/logo-3d-manifest.json"))
    parser.add_argument("--target", action="append", default=[])
    parser.add_argument("--all-planned", action="store_true")
    parser.add_argument("--blend-dir", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def srgb_channel_to_linear(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def material_rgba(spec):
    if "baseColorLinear" in spec:
        rgb = list(spec["baseColorLinear"])
    else:
        raw = spec["color"].lstrip("#")
        rgb = [srgb_channel_to_linear(int(raw[i : i + 2], 16) / 255.0) for i in (0, 2, 4)]
    return (*rgb, 1.0)

def load_manifest(repo_root, manifest_path):
    path = manifest_path if manifest_path.is_absolute() else repo_root / manifest_path
    return json.loads(path.read_text(encoding="utf-8"))


def select_targets(manifest, args):
    targets = manifest["targets"]
    if args.target:
        wanted = set(args.target)
        selected = [item for item in targets if item["id"] in wanted]
        missing = wanted - {item["id"] for item in selected}
        if missing:
            raise SystemExit(f"Unknown target ids: {', '.join(sorted(missing))}")
        return selected
    if args.all_planned:
        return [item for item in targets if item.get("sourceType") == "vector-svg" and item.get("status") in {"planned", "ready"}]
    raise SystemExit("Pass --target ID or --all-planned")


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def enable_svg_importer():
    if hasattr(bpy.ops.import_curve, "svg"):
        return
    try:
        bpy.ops.preferences.addon_enable(module="io_curve_svg")
    except Exception as exc:
        raise RuntimeError("Blender SVG importer is unavailable") from exc
    if not hasattr(bpy.ops.import_curve, "svg"):
        raise RuntimeError("Blender SVG importer did not register")

def join_imported_curves(source):
    enable_svg_importer()
    before = set(bpy.context.scene.objects)
    bpy.ops.import_curve.svg(filepath=str(source))
    imported = [obj for obj in bpy.context.scene.objects if obj not in before and obj.type == "CURVE"]
    if not imported:
        raise RuntimeError(f"SVG produced no curve objects: {source}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in imported:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = imported[0]
    if len(imported) > 1:
        bpy.ops.object.join()
    return bpy.context.view_layer.objects.active

def normalize_curve(curve, profile):
    front_span = float(profile["frontSpan"])
    source_span = max(float(curve.dimensions.x), float(curve.dimensions.y))
    if source_span <= 0:
        raise RuntimeError("SVG has zero front span")
    scale = front_span / source_span
    curve.scale = (scale, scale, scale)
    bpy.context.view_layer.objects.active = curve
    curve.data.dimensions = "2D"
    curve.data.fill_mode = "BOTH"
    depth = float(profile["depth"])
    curve.data.extrude = depth / (2.0 * scale)
    curve.data.bevel_depth = 0.0
    curve.data.resolution_u = 12
    bpy.ops.object.convert(target="MESH")
    mesh = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mesh.rotation_euler[0] = math.radians(90.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    return mesh

ZERO_AREA_EPSILON = 1e-12


def collapse_zero_area_faces(bm, zero_area_epsilon=ZERO_AREA_EPSILON, max_rounds=24):
    for _ in range(max_rounds):
        zero_faces = [face for face in bm.faces if face.is_valid and face.calc_area() <= zero_area_epsilon]
        if not zero_faces:
            return
        collapse_edges = {
            min(face.edges, key=lambda edge: (edge.verts[0].co - edge.verts[1].co).length)
            for face in zero_faces
            if face.edges
        }
        if not collapse_edges:
            break
        bmesh.ops.collapse(bm, edges=list(collapse_edges), uvs=False)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-8)
    remaining = [face for face in bm.faces if face.is_valid and face.calc_area() <= zero_area_epsilon]
    if remaining:
        raise RuntimeError(f"zero-area faces remain after cleanup: {len(remaining)}")


def clean_mesh_topology(mesh, triangulate=False, zero_area_epsilon=ZERO_AREA_EPSILON):
    bm = bmesh.new()
    bm.from_mesh(mesh.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-6)
    bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=1e-9)
    if triangulate:
        bmesh.ops.triangulate(bm, faces=list(bm.faces))
        bmesh.ops.dissolve_degenerate(bm, edges=list(bm.edges), dist=1e-9)
    else:
        bmesh.ops.dissolve_limit(
            bm,
            angle_limit=0.001,
            verts=list(bm.verts),
            edges=list(bm.edges),
            use_dissolve_boundaries=False,
        )
    collapse_zero_area_faces(bm, zero_area_epsilon=zero_area_epsilon)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    non_manifold = [edge for edge in bm.edges if not edge.is_manifold]
    zero_faces = [face for face in bm.faces if face.calc_area() <= zero_area_epsilon]
    if non_manifold or zero_faces:
        bm.free()
        raise RuntimeError(
            f"Topology QA failed: non-manifold={len(non_manifold)} zero-area={len(zero_faces)}"
        )
    bm.to_mesh(mesh.data)
    bm.free()
    mesh.data.update()


def finish_geometry(mesh, profile, zero_area_epsilon=ZERO_AREA_EPSILON):
    clean_mesh_topology(mesh, triangulate=False, zero_area_epsilon=zero_area_epsilon)
    bevel = mesh.modifiers.new(name="JesteiReferenceBevel", type="BEVEL")
    bevel.width = float(profile.get("bevelRatio", 0.0)) * float(profile["frontSpan"])
    bevel.segments = int(profile.get("bevelSegments", 1))
    bevel.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    clean_mesh_topology(mesh, triangulate=True, zero_area_epsilon=zero_area_epsilon)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    mesh.location = (0.0, 0.0, 0.0)
    if hasattr(bpy.ops.object, "shade_smooth_by_angle"):
        bpy.ops.object.shade_smooth_by_angle()
    return mesh


def build_material(name, spec):
    material = bpy.data.materials.new(name=name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = material_rgba(spec)
    bsdf.inputs["Metallic"].default_value = float(spec.get("metalness", 0.0))
    bsdf.inputs["Roughness"].default_value = float(spec.get("roughness", 0.4))
    return material


def assign_material(mesh, name, spec):
    mesh.data.materials.clear()
    mesh.data.materials.append(build_material(name, spec))
    mesh.active_material_index = 0

def export_target(repo_root, target, manifest, profile, blend_dir=None):
    source = repo_root / target["source"]
    output = repo_root / target.get("packOutput", target["output"])
    if not source.exists():
        raise FileNotFoundError(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    reset_scene()
    curve = join_imported_curves(source)
    zero_area_epsilon = float(target.get("zeroAreaEpsilon", ZERO_AREA_EPSILON))
    mesh = finish_geometry(normalize_curve(curve, profile), profile, zero_area_epsilon)
    mesh.name = re.sub(r"[^A-Za-z0-9_.-]+", "_", target["id"])
    material_id = target["materialId"]
    assign_material(mesh, material_id, manifest["materials"][material_id])
    bpy.ops.object.select_all(action="DESELECT")
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = mesh
    pack_dir = output.parent
    stem = output.stem
    blend_path = (blend_dir / f"{target['id']}.blend") if blend_dir else (pack_dir / f"{stem}.blend")
    blend_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), copy=True)

    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )
    bpy.ops.export_scene.fbx(
        filepath=str(pack_dir / f"{stem}.fbx"),
        use_selection=True,
        axis_forward="-Z",
        axis_up="Y",
        apply_unit_scale=True,
        add_leaf_bones=False,
    )
    bpy.ops.wm.obj_export(
        filepath=str(pack_dir / f"{stem}.obj"),
        export_selected_objects=True,
        export_materials=True,
        forward_axis="NEGATIVE_Z",
        up_axis="Y",
    )
    bpy.ops.wm.stl_export(
        filepath=str(pack_dir / f"{stem}.stl"),
        export_selected_objects=True,
    )
    render_preview(mesh, pack_dir / "preview" / f"{stem}.png", manifest.get("preview", {}))
    write_metadata(pack_dir / "metadata" / f"{stem}.json", target, profile, mesh, manifest, source)
    dims = tuple(round(float(value), 6) for value in mesh.dimensions)
    print(f"GENERATED {target['id']} pack={pack_dir} dimensions={dims}")


def point_camera(camera, target=(0.0, 0.0, 0.0)):
    from mathutils import Vector
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_preview(mesh, path, spec):
    path.parent.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    size = int(spec.get("size", 1024))
    scene.render.resolution_x = size
    scene.render.resolution_y = size
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = bool(spec.get("transparent", True))
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(path)

    camera_data = bpy.data.cameras.new("LogoPreviewCamera")
    camera = bpy.data.objects.new("LogoPreviewCamera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(float(mesh.dimensions.x), float(mesh.dimensions.z)) * 1.28
    camera.location = (0.0, -4.0, 0.0)
    point_camera(camera)
    for name, location, energy, size_value in (
        ("Key", (3.0, -4.0, 4.0), 900.0, 4.0),
        ("Fill", (-3.0, -2.0, 1.0), 500.0, 5.0),
        ("Rim", (0.0, 2.5, 3.0), 700.0, 3.0),
    ):
        light_data = bpy.data.lights.new(name, "AREA")
        light_data.energy = energy
        light_data.shape = "DISK"
        light_data.size = size_value
        light = bpy.data.objects.new(name, light_data)
        scene.collection.objects.link(light)
        light.location = location
        direction = mesh.location - light.location
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    scene.world.color = (0.035, 0.035, 0.035)
    bpy.ops.render.render(write_still=True)


def write_metadata(path, target, profile, mesh, manifest, source):
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "id": target["id"],
        "family": target["family"],
        "variant": target["variant"],
        "colorway": target.get("colorway"),
        "source": target.get("source"),
        "sourceType": target.get("sourceType"),
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "materialId": target["materialId"],
        "geometryProfile": manifest["defaultGeometryProfile"],
        "dimensions": [round(float(v), 6) for v in mesh.dimensions],
        "formats": manifest["exportFormats"],
        "localMasterFormats": manifest.get("localMasterFormats", ["blend"]),
        "blenderVersion": bpy.app.version_string,
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    args = cli_args()
    repo_root = args.repo_root.resolve()
    manifest = load_manifest(repo_root, args.manifest)
    profile = manifest["geometryProfiles"][manifest["defaultGeometryProfile"]]
    targets = select_targets(manifest, args)
    if args.dry_run:
        for target in targets:
            print(f"DRY-RUN {target['id']} <- {target.get('source')} -> {target.get('output')}")
        return

    blend_dir = args.blend_dir.resolve() if args.blend_dir else None
    for target in targets:
        if target.get("sourceType") != "vector-svg":
            continue
        export_target(repo_root, target, manifest, profile, blend_dir)


if __name__ == "__main__":
    main()
