import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const packedHopperBridge = "package/bridge/hopper_bridge.py";
const packedCutterBridge = "package/bridge/cutter/rea_bridge.py";
const packedGhidraBridge = "package/bridge/ghidra/ReaGhidraBridge.java";
const packedGhidraActivator =
  "package/bridge/ghidra/ReaGhidraBundleActivator.java";

/** Check shipped bridge files; real-provider lanes verify runtime behavior. */
export async function verifyPackedBridge({ tarball, packedFiles }) {
  for (const path of [
    packedHopperBridge,
    packedCutterBridge,
    packedGhidraBridge,
    packedGhidraActivator,
  ]) {
    if (!packedFiles.includes(path)) throw new Error(`package omitted ${path}`);
  }
  // Read the packed source without extracting into the caller's leased root.
  await exec("python3", [
    "-c",
    [
      "import ast, sys, tarfile",
      "with tarfile.open(sys.argv[1]) as archive:",
      "    with archive.extractfile(sys.argv[2]) as source:",
      "        ast.parse(source.read().decode('utf-8'), filename=sys.argv[2])",
    ].join("\n"),
    tarball,
    packedHopperBridge,
  ]);
}
