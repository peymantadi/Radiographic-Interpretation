'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Trash2, PlusCircle, ChevronDown, ChevronRight, Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// ---------- Utility helpers ----------
const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="shadow-sm border rounded-2xl">
      <CardHeader onClick={() => setOpen(!open)} className="cursor-pointer py-4">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      {open && <CardContent className="pt-0 pb-4">{children}</CardContent>}
    </Card>
  );
};

const Row = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">{children}</div>
);

const Col = ({ children }) => <div className="flex flex-col gap-2">{children}</div>;

const MultiToggle = ({ options, value, onChange, label }) => {
  const toggle = (opt) => {
    const exists = value.includes(opt);
    const next = exists ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button key={opt} variant={value.includes(opt) ? "default" : "secondary"} onClick={() => toggle(opt)} size="sm" className="rounded-xl">
            {opt}
          </Button>
        ))}
      </div>
    </div>
  );
};

const YesNo = ({ label, value, onChange, yes = "Present", no = "Absent" }) => (
  <div className="flex items-center justify-between gap-3 p-3 border rounded-xl">
    <div>
      <Label className="text-sm">{label}</Label>
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={value ? "default" : "secondary"}>{value ? yes : no}</Badge>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  </div>
);

const Status = ({ status }) => {
  if (!status?.text) return null;
  const isOk = status.type === "ok";
  const isWarn = status.type === "warn";
  return (
    <div className={`flex items-center gap-2 text-sm ${isOk ? "text-green-400" : isWarn ? "text-yellow-400" : "text-red-400"}`} aria-live="polite">
      {isOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      <span>{status.text}</span>
    </div>
  );
};

// ---------- Clipboard-safe helpers ----------
async function safeCopy(text, opts = {}) {
  const { selectFallbackEl } = opts;
  try {
    if (typeof window !== "undefined" && window.isSecureContext && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    }
  } catch (_) {}

  // execCommand fallback (may still be blocked in sandbox)
  try {
    if (selectFallbackEl?.current) {
      const el = selectFallbackEl.current;
      el.focus();
      el.select();
      const ok = document.execCommand("copy");
      if (ok) return { ok: true, method: "execCommand" };
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) return { ok: true, method: "execCommand" };
    }
  } catch (_) {}

  return { ok: false, method: "blocked" };
}

function downloadText(filename, text) {
  try {
    const blob = new Blob([text ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (_) {
    return false;
  }
}

// ---------- Local storage hook ----------
const LS_KEY = "rx-note-builder-v1";
const usePersistentState = (initial) => {
  const [state, setState] = useState(() => {
    try {
      if (typeof window === "undefined") return initial;
      const cached = window.localStorage.getItem(LS_KEY);
      return cached ? JSON.parse(cached) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_KEY, JSON.stringify(state));
      }
    } catch {}
  }, [state]);
  return [state, setState];
};

// ---------- Default Model ----------
const defaultModel = {
  header: {
    patient: "",
    date: "",
    images: [],
  },
  quality: {
    density: "Adequate",
    densityNote: "",
    angulation: "Acceptable",
    fov: "",
    artifacts: false,
    artifactsNote: "",
  },
  teeth: {
    missing: "",
    unerupted: "",
    caries: "",
    restorations: "",
    roots: "",
  },
  tdi: {
    classes: [],
    mobility: "",
    rootFracture: "",
  },
  perio: {
    boneHeight: [],
    bonePattern: [],
    calculus: false,
    calculusLoc: "",
    lamina: "Intact",
  },
  periapical: {
    trabecular: "Normal",
    radiolucencies: "",
    radiopacities: [],
    otherLesions: "",
  },
  endo: {
    rct: "",
    postCore: "",
    missed: "",
    fractureResorption: "",
    healing: "",
  },
  implants: {
    location: "",
    osseo: "",
    marginalBone: "",
    angulation: "",
    complications: "",
  },
  anatomy: {
    sinus: [],
    nasal: "",
    mandibularCanal: "",
    mentalForamen: "",
    incisiveForamen: "",
    tmj: [],
    tonsilloliths: false,
    carotid: false,
    carotidNote: "",
  },
  fractures: {
    mandibular: "",
    maxillary: "",
    alveolar: "",
    zygomatic: "",
    other: "",
  },
  pathology: {
    path: "",
    odontomas: "",
    rootFragments: "",
    foreignBodies: "",
    developmental: "",
  },
  cbct: {
    volume: "",
    crossSection: "",
    alveolar: "",
    cortical: "",
    ian: "",
    ostium: "",
    airway: "",
    incidental: "",
  },
  summary: {
    impression: "",
    ddx: "",
  },
};

// ---------- Formatting ----------
const line = (label, content) => (content && String(content).trim().length > 0 ? `${label}: ${content}` : "");
const joinNonEmpty = (arr, sep = " | ") => arr.filter(Boolean).join(sep);

const buildNote = (m) => {
  const header = joinNonEmpty([
    line("Type of Image(s)", m.header.images?.join(" / ")),
  ]);

  const quality = joinNonEmpty([
    line("Density/contrast", `${m.quality.density}${m.quality.densityNote ? ` (${m.quality.densityNote})` : ""}`),
    line("Angulation/positioning", m.quality.angulation),
    line("Field of view (CBCT)", m.quality.fov),
    m.quality.artifacts ? line("Artifacts", `Present${m.quality.artifactsNote ? ` (${m.quality.artifactsNote})` : ""}`) : line("Artifacts", "Absent"),
  ], "\n");

  const teeth = joinNonEmpty([
    line("Missing teeth", m.teeth.missing),
    line("Unerupted/impacted teeth", m.teeth.unerupted),
    line("Caries", m.teeth.caries),
    line("Existing restorations and prostheses", m.teeth.restorations),
    line("Root morphology and resorption", m.teeth.roots),
  ], "\n");

  const tdi = joinNonEmpty([
    line("Fractured teeth (Ellis)", m.tdi.classes?.join(", ")),
    line("Tooth mobility / displacement / luxation / avulsion", m.tdi.mobility),
    line("Root fractures", m.tdi.rootFracture),
  ], "\n");

  const perio = joinNonEmpty([
    line("Alveolar bone height", m.perio.boneHeight?.join(" / ")),
    line("Bone pattern", m.perio.bonePattern?.join(" / ")),
    m.perio.calculus ? line("Calculus deposits", `${"Present"}${m.perio.calculusLoc ? ` (${m.perio.calculusLoc})` : ""}`) : line("Calculus deposits", "Absent"),
    line("Lamina dura", m.perio.lamina),
  ], "\n");

  const periapical = joinNonEmpty([
    line("Trabecular pattern", m.periapical.trabecular),
    line("Periapical radiolucencies", m.periapical.radiolucencies),
    line("Periapical radiopacities", m.periapical.radiopacities?.join(" / ")),
    line("Other osseous lesions", m.periapical.otherLesions),
  ], "\n");

  const endo = joinNonEmpty([
    line("RCT presence and quality", m.endo.rct),
    line("Post and core", m.endo.postCore),
    line("Missed canals / untreated roots", m.endo.missed),
    line("Signs of root fracture / resorption", m.endo.fractureResorption),
    line("Periapical healing vs persistent radiolucency", m.endo.healing),
  ], "\n");

  const implants = joinNonEmpty([
    line("Location", m.implants.location),
    line("Osseointegration", m.implants.osseo),
    line("Marginal bone levels", m.implants.marginalBone),
    line("Angulation", m.implants.angulation),
    line("Complications", m.implants.complications),
  ], "\n");

  const anatomy = joinNonEmpty([
    line("Maxillary sinus", m.anatomy.sinus?.join(" / ")),
    line("Nasal cavity / septum", m.anatomy.nasal),
    line("Mandibular canal", m.anatomy.mandibularCanal),
    line("Mental foramen", m.anatomy.mentalForamen),
    line("Incisive foramen", m.anatomy.incisiveForamen),
    line("TMJ", m.anatomy.tmj?.join(" / ")),
    m.anatomy.tonsilloliths ? "Tonsilloliths: Present" : "Tonsilloliths: Absent",
    m.anatomy.carotid ? line("Carotid artery calcifications", m.anatomy.carotidNote || "Present (consider medical referral)") : "Carotid artery calcifications: Absent",
  ], "\n");

  const fractures = joinNonEmpty([
    line("Mandibular fracture", m.fractures.mandibular),
    line("Maxillary fracture", m.fractures.maxillary),
    line("Alveolar process fractures", m.fractures.alveolar),
    line("Zygomatic arch / orbital floor", m.fractures.zygomatic),
    line("Other craniofacial fractures noted", m.fractures.other),
  ], "\n");

  const pathology = joinNonEmpty([
    line("Pathology / Abnormal Findings", m.pathology.path),
    line("Odontomas / supernumerary", m.pathology.odontomas),
    line("Retained root fragments", m.pathology.rootFragments),
    line("Foreign bodies", m.pathology.foreignBodies),
    line("Developmental anomalies", m.pathology.developmental),
  ], "\n");

  const cbct = joinNonEmpty([
    line("Volume reviewed", m.cbct.volume),
    line("Cross-sectional views", m.cbct.crossSection),
    line("Alveolar bone width/height", m.cbct.alveolar),
    line("Cortical bone integrity", m.cbct.cortical),
    line("IAN canal relation", m.cbct.ian),
    line("Maxillary sinus ostium/septa", m.cbct.ostium),
    line("Airway evaluation", m.cbct.airway),
    line("CBCT incidental findings", m.cbct.incidental),
  ], "\n");

  const summary = joinNonEmpty([
    line("Summary / Impression", m.summary.impression),
    line("Differential diagnosis", m.summary.ddx),
  ], "\n");

  const blocks = [
    ["Type of Image(s)", header],
    ["Image Quality", quality],
    ["Teeth", teeth],
    ["Traumatic Dental Injuries", tdi],
    ["Periodontium", perio],
    ["Periapical / Periradicular Findings", periapical],
    ["Endodontic Therapy", endo],
    ["Implants", implants],
    ["Anatomic Structures", anatomy],
    ["Bony / Maxillofacial Fractures", fractures],
    ["Pathology / Abnormal Findings", pathology],
    ["CBCT-Specific Observations", cbct],
    ["Summary / Impression", summary],
  ]
    .filter(([_, content]) => content && content.trim().length > 0)
    .map(([title, content]) => `\n${title}\n${"-".repeat(title.length)}\n${content}`)
    .join("\n\n");

  return blocks.trim();
};

// ---------- Main Component ----------
export default function RadiographicNoteBuilder() {
  const [model, setModel] = usePersistentState(defaultModel);
  const note = useMemo(() => buildNote(model), [model]);
  const previewRef = useRef(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [scratch, setScratch] = useState("");
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const update = (path, value) => {
    setModel((prev) => {
      const next = structuredClone(prev);
      let cursor = next;
      const keys = path.split(".");
      for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
      cursor[keys.at(-1)] = value;
      return next;
    });
  };

  const handleCopyNote = async () => {
    const res = await safeCopy(note || "", { selectFallbackEl: previewRef });
    if (res.ok) {
      setStatus({ type: "ok", text: `Copied note (${res.method}).` });
    } else {
      // Final fallback: download
      const ok = downloadText("radiographic-note.txt", note || "");
      setStatus({ type: ok ? "warn" : "error", text: ok ? "Clipboard blocked — downloaded radiographic-note.txt instead." : "Clipboard blocked — please select the preview, then press Ctrl/Cmd+C." });
      // Also auto-select the preview for easy manual copy
      try { previewRef.current?.focus(); previewRef.current?.select(); } catch {}
    }
  };

  const handleCopyText = async (text, label = "text") => {
    const res = await safeCopy(text || "");
    if (res.ok) setStatus({ type: "ok", text: `Copied ${label} (${res.method}).` });
    else {
      setScratch(text || "");
      const ok = downloadText(`${label.replace(/\s+/g, "-").toLowerCase()}.txt`, text || "");
      setStatus({ type: ok ? "warn" : "error", text: ok ? `Clipboard blocked — moved ${label} to Scratchpad and downloaded a .txt` : `Clipboard blocked — ${label} placed in Scratchpad for manual copy.` });
    }
  };

  const resetAll = () => setModel(defaultModel);

  const quickSet = {
    setPAN: () => update("header.images", ["PAN"]),
    setBW: () => update("header.images", ["BW"]),
    setFMX: () => update("header.images", ["FMX"]),
    setCBCT: () => update("header.images", ["CBCT"]),
  };

  const runDiagnostics = async () => {
    const results = [];
    const r1 = await safeCopy("test");
    results.push({ name: "safeCopy('test')", pass: r1.ok || r1.method === "blocked", detail: r1.method });
    const r2 = downloadText("test.txt", "hello");
    results.push({ name: "downloadText('test.txt')", pass: r2, detail: r2 ? "triggered" : "failed" });
    const sample = buildNote({
      ...defaultModel,
      header: { ...defaultModel.header, images: ["PAN", "BW"] },
      quality: { ...defaultModel.quality },
    });
    results.push({ name: "buildNote(sample) returns non-empty", pass: !!sample.length, detail: `${sample.length} chars` });
    console.table(results);
    setStatus({ type: results.every(r => r.pass) ? "ok" : "warn", text: `Diagnostics: ${results.filter(r=>r.pass).length}/${results.length} checks passed. See console for details.` });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto text-white bg-gradient-to-b from-[#0b0c10] to-[#0b0c10] min-h-screen">
      <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-3xl font-semibold mb-2">
        Radiographic Interpretation Note Builder
      </motion.h1>
      <p className="text-sm text-muted-foreground mb-2">Click to select findings and type details. The note preview updates live. Your inputs auto-save locally so it's ready every day.</p>
      <Status status={status} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-3">
        {/* LEFT: Controls */}
        <div className="flex flex-col gap-4">
          <Section title="Header" defaultOpen>
            <Row>
              <Col>
                <Label>Patient (optional)</Label>
                <Input value={model.header.patient} onChange={(e) => update("header.patient", e.target.value)} placeholder="Name / ID" />
              </Col>
              <Col>
                <Label>Date</Label>
                <Input type="date" value={model.header.date} onChange={(e) => update("header.date", e.target.value)} />
              </Col>
            </Row>
            <div className="mt-3">
              <MultiToggle
                label="Type of Image(s)"
                options={["PAN", "PA", "BW", "FMX", "CBCT"]}
                value={model.header.images}
                onChange={(v) => update("header.images", v)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="xs" variant="outline" onClick={quickSet.setPAN}>Quick: PAN</Button>
                <Button size="xs" variant="outline" onClick={quickSet.setBW}>Quick: BW</Button>
                <Button size="xs" variant="outline" onClick={quickSet.setFMX}>Quick: FMX</Button>
                <Button size="xs" variant="outline" onClick={quickSet.setCBCT}>Quick: CBCT</Button>
              </div>
            </div>
          </Section>

          <Section title="Image Quality" defaultOpen>
            <Row>
              <Col>
                <Label>Density / contrast</Label>
                <div className="flex gap-2 flex-wrap">
                  {["Adequate", "Inadequate"].map((opt) => (
                    <Button key={opt} size="sm" variant={model.quality.density === opt ? "default" : "secondary"} onClick={() => update("quality.density", opt)}>
                      {opt}
                    </Button>
                  ))}
                </div>
                <Input className="mt-2" placeholder="If inadequate, explain" value={model.quality.densityNote} onChange={(e) => update("quality.densityNote", e.target.value)} />
              </Col>
              <Col>
                <Label>Angulation / positioning</Label>
                <div className="flex gap-2 flex-wrap">
                  {["Acceptable", "Not ideal"].map((opt) => (
                    <Button key={opt} size="sm" variant={model.quality.angulation === opt ? "default" : "secondary"} onClick={() => update("quality.angulation", opt)}>
                      {opt}
                    </Button>
                  ))}
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
                <Label>Field of view (CBCT)</Label>
                <div className="flex gap-2 flex-wrap">
                  {["Limited", "Quadrant", "Full arch", "Full skull", "N/A"].map((opt) => (
                    <Button key={opt} size="sm" variant={model.quality.fov === opt ? "default" : "secondary"} onClick={() => update("quality.fov", opt)}>
                      {opt}
                    </Button>
                  ))}
                </div>
              </Col>
              <Col>
                <YesNo label="Artifacts" value={model.quality.artifacts} onChange={(v) => update("quality.artifacts", v)} />
                {model.quality.artifacts && (
                  <Input className="mt-2" placeholder="Describe artifacts" value={model.quality.artifactsNote} onChange={(e) => update("quality.artifactsNote", e.target.value)} />
                )}
              </Col>
            </Row>
          </Section>

          <Section title="Teeth">
            <Col>
              <Textarea placeholder="Missing teeth (e.g., #1, 16, 17, 32)" value={model.teeth.missing} onChange={(e) => update("teeth.missing", e.target.value)} />
              <Textarea placeholder="Unerupted/impacted teeth" value={model.teeth.unerupted} onChange={(e) => update("teeth.unerupted", e.target.value)} />
              <Textarea placeholder="Caries (tooth #, surface, extent)" value={model.teeth.caries} onChange={(e) => update("teeth.caries", e.target.value)} />
              <Textarea placeholder="Existing restorations and prostheses" value={model.teeth.restorations} onChange={(e) => update("teeth.restorations", e.target.value)} />
              <Textarea placeholder="Root morphology and resorption" value={model.teeth.roots} onChange={(e) => update("teeth.roots", e.target.value)} />
            </Col>
          </Section>

          <Section title="Traumatic Dental Injuries">
            <MultiToggle
              label="Fractured teeth (Ellis classification)"
              options={[
                "Class I – enamel only",
                "Class II – enamel + dentin (no pulp)",
                "Class III – involves pulp",
                "Class IV – nonvital tooth with fracture",
                "Class V – avulsion",
                "Class VI – root fracture (apical/mid/cervical)",
                "Class VII – displacement without fracture",
                "Class VIII – crown fracture (large)",
                "Class IX – primary teeth injuries",
              ]}
              value={model.tdi.classes}
              onChange={(v) => update("tdi.classes", v)}
            />
            <Textarea placeholder="Tooth mobility / displacement / luxation / avulsion" value={model.tdi.mobility} onChange={(e) => update("tdi.mobility", e.target.value)} />
            <Textarea placeholder="Root fractures (H/V/Obl; location apical/middle/coronal third)" value={model.tdi.rootFracture} onChange={(e) => update("tdi.rootFracture", e.target.value)} />
          </Section>

          <Section title="Periodontium">
            <MultiToggle label="Alveolar bone height" options={["Normal", "Horizontal loss – mild", "Horizontal – moderate", "Horizontal – severe", "Vertical loss – mild", "Vertical – moderate", "Vertical – severe"]} value={model.perio.boneHeight} onChange={(v) => update("perio.boneHeight", v)} />
            <MultiToggle label="Bone pattern" options={["Normal", "Generalized changes", "Localized changes"]} value={model.perio.bonePattern} onChange={(v) => update("perio.bonePattern", v)} />
            <Row>
              <Col>
                <YesNo label="Calculus deposits" value={model.perio.calculus} onChange={(v) => update("perio.calculus", v)} />
              </Col>
              <Col>
                {model.perio.calculus && <Input placeholder="Location (e.g., posterior interproximal)" value={model.perio.calculusLoc} onChange={(e) => update("perio.calculusLoc", e.target.value)} />}
              </Col>
            </Row>
            <div className="flex gap-2 flex-wrap mt-2">
              {["Intact", "Widened", "Absent"].map((opt) => (
                <Button key={opt} size="sm" variant={model.perio.lamina === opt ? "default" : "secondary"} onClick={() => update("perio.lamina", opt)}>
                  Lamina dura: {opt}
                </Button>
              ))}
            </div>
          </Section>

          <Section title="Periapical / Periradicular Findings">
            <div className="flex gap-2 flex-wrap">
              {["Normal", "Altered"].map((opt) => (
                <Button key={opt} size="sm" variant={model.periapical.trabecular === (opt === "Normal" ? "Normal" : "Altered pattern") ? "default" : "secondary"} onClick={() => update("periapical.trabecular", opt === "Normal" ? "Normal" : "Altered pattern")}>
                  Trabecular: {opt}
                </Button>
              ))}
            </div>
            <Textarea placeholder="Periapical radiolucencies (tooth #, size, borders, relation to apex)" value={model.periapical.radiolucencies} onChange={(e) => update("periapical.radiolucencies", e.target.value)} />
            <MultiToggle label="Periapical radiopacities" options={["Condensing osteitis", "Idiopathic osteosclerosis", "Hypercementosis"]} value={model.periapical.radiopacities} onChange={(v) => update("periapical.radiopacities", v)} />
            <Textarea placeholder="Other osseous lesions (cysts / granulomas / neoplasms)" value={model.periapical.otherLesions} onChange={(e) => update("periapical.otherLesions", e.target.value)} />
          </Section>

          <Section title="Endodontic Therapy (if present)">
            <Textarea placeholder="RCT presence and quality: length, density, voids, perforations" value={model.endo.rct} onChange={(e) => update("endo.rct", e.target.value)} />
            <Textarea placeholder="Post and core: present/absent, adaptation, relation to root walls" value={model.endo.postCore} onChange={(e) => update("endo.postCore", e.target.value)} />
            <Textarea placeholder="Missed canals / untreated roots" value={model.endo.missed} onChange={(e) => update("endo.missed", e.target.value)} />
            <Textarea placeholder="Signs of root fracture / resorption" value={model.endo.fractureResorption} onChange={(e) => update("endo.fractureResorption", e.target.value)} />
            <Textarea placeholder="Periapical healing vs persistent radiolucency" value={model.endo.healing} onChange={(e) => update("endo.healing", e.target.value)} />
          </Section>

          <Section title="Implants (if present)">
            <Textarea placeholder="Location (tooth # / region)" value={model.implants.location} onChange={(e) => update("implants.location", e.target.value)} />
            <Textarea placeholder="Osseointegration: adequate bone contact / peri-implant radiolucency" value={model.implants.osseo} onChange={(e) => update("implants.osseo", e.target.value)} />
            <Textarea placeholder="Marginal bone levels: normal / crestal bone loss (measure)" value={model.implants.marginalBone} onChange={(e) => update("implants.marginalBone", e.target.value)} />
            <Textarea placeholder="Angulation: appropriate / malpositioned / proximity to structures" value={model.implants.angulation} onChange={(e) => update("implants.angulation", e.target.value)} />
            <Textarea placeholder="Complications: thread exposure, peri-implantitis, fracture, loose components" value={model.implants.complications} onChange={(e) => update("implants.complications", e.target.value)} />
          </Section>

          <Section title="Anatomic Structures">
            <MultiToggle label="Maxillary sinus" options={["Normal", "Thickened membrane", "Polyp", "Mucous retention cyst", "Opacification", "Perforation"]} value={model.anatomy.sinus} onChange={(v) => update("anatomy.sinus", v)} />
            <Textarea placeholder="Nasal cavity / septum: WNL / Deviated / Pathology" value={model.anatomy.nasal} onChange={(e) => update("anatomy.nasal", e.target.value)} />
            <Textarea placeholder="Mandibular canal: Traceable / Not traceable / Close relation to roots (#)" value={model.anatomy.mandibularCanal} onChange={(e) => update("anatomy.mandibularCanal", e.target.value)} />
            <Textarea placeholder="Mental foramen: Identified / Not visualized / Superimposed" value={model.anatomy.mentalForamen} onChange={(e) => update("anatomy.mentalForamen", e.target.value)} />
            <Textarea placeholder="Incisive foramen: Normal / Enlarged" value={model.anatomy.incisiveForamen} onChange={(e) => update("anatomy.incisiveForamen", e.target.value)} />
            <MultiToggle label="TMJ (PAN/CBCT)" options={["Normal", "Flattening", "Osteophytes", "Joint space narrowing", "Ankylosis"]} value={model.anatomy.tmj} onChange={(v) => update("anatomy.tmj", v)} />
            <Row>
              <Col>
                <YesNo label="Tonsilloliths" value={model.anatomy.tonsilloliths} onChange={(v) => update("anatomy.tonsilloliths", v)} />
              </Col>
              <Col>
                <YesNo label="Carotid artery calcifications" value={model.anatomy.carotid} onChange={(v) => update("anatomy.carotid", v)} />
                {model.anatomy.carotid && (
                  <Input className="mt-2" placeholder="Side/extent/severity; add referral note" value={model.anatomy.carotidNote} onChange={(e) => update("anatomy.carotidNote", e.target.value)} />
                )}
              </Col>
            </Row>
          </Section>

          <Section title="Bony / Maxillofacial Fractures">
            <Textarea placeholder="Mandibular fracture (location; displaced/non; comminuted)" value={model.fractures.mandibular} onChange={(e) => update("fractures.mandibular", e.target.value)} />
            <Textarea placeholder="Maxillary fracture (Le Fort pattern)" value={model.fractures.maxillary} onChange={(e) => update("fractures.maxillary", e.target.value)} />
            <Textarea placeholder="Alveolar process fractures (localized/segmental)" value={model.fractures.alveolar} onChange={(e) => update("fractures.alveolar", e.target.value)} />
            <Textarea placeholder="Zygomatic arch / orbital floor: intact / fractured / displaced" value={model.fractures.zygomatic} onChange={(e) => update("fractures.zygomatic", e.target.value)} />
            <Textarea placeholder="Other craniofacial fractures noted" value={model.fractures.other} onChange={(e) => update("fractures.other", e.target.value)} />
          </Section>

          <Section title="Pathology / Abnormal Findings">
            <Textarea placeholder="Cysts, tumors, fibro-osseous lesions, lucent/opaque anomalies" value={model.pathology.path} onChange={(e) => update("pathology.path", e.target.value)} />
            <Textarea placeholder="Odontomas / supernumerary teeth" value={model.pathology.odontomas} onChange={(e) => update("pathology.odontomas", e.target.value)} />
            <Textarea placeholder="Retained root fragments" value={model.pathology.rootFragments} onChange={(e) => update("pathology.rootFragments", e.target.value)} />
            <Textarea placeholder="Foreign bodies" value={model.pathology.foreignBodies} onChange={(e) => update("pathology.foreignBodies", e.target.value)} />
            <Textarea placeholder="Developmental anomalies" value={model.pathology.developmental} onChange={(e) => update("pathology.developmental", e.target.value)} />
          </Section>

          <Section title="CBCT-Specific Observations (if applicable)">
            <Textarea placeholder="Volume reviewed" value={model.cbct.volume} onChange={(e) => update("cbct.volume", e.target.value)} />
            <Textarea placeholder="Cross-sectional views: periapical changes, fractures, resorption" value={model.cbct.crossSection} onChange={(e) => update("cbct.crossSection", e.target.value)} />
            <Textarea placeholder="Alveolar bone width and height (implant planning)" value={model.cbct.alveolar} onChange={(e) => update("cbct.alveolar", e.target.value)} />
            <Textarea placeholder="Cortical bone integrity: intact / perforated / thinned" value={model.cbct.cortical} onChange={(e) => update("cbct.cortical", e.target.value)} />
            <Textarea placeholder="IAN canal relation: close / contacting / separate" value={model.cbct.ian} onChange={(e) => update("cbct.ian", e.target.value)} />
            <Textarea placeholder="Maxillary sinus ostium patency, septa" value={model.cbct.ostium} onChange={(e) => update("cbct.ostium", e.target.value)} />
            <Textarea placeholder="Airway evaluation: Adequate / Narrowed / Obstructed" value={model.cbct.airway} onChange={(e) => update("cbct.airway", e.target.value)} />
            <Textarea placeholder="Incidental findings (cervical vertebrae, glands, paranasal sinuses, etc.)" value={model.cbct.incidental} onChange={(e) => update("cbct.incidental", e.target.value)} />
          </Section>

          <Section title="Summary / Impression" defaultOpen>
            <Textarea placeholder="Concise summary of key findings" value={model.summary.impression} onChange={(e) => update("summary.impression", e.target.value)} />
            <Textarea placeholder="Differential diagnosis if lesion identified" value={model.summary.ddx} onChange={(e) => update("summary.ddx", e.target.value)} />
          </Section>

          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleCopyNote} className="rounded-2xl"><Copy className="h-4 w-4 mr-2" /> Copy note</Button>
            <Button variant="secondary" onClick={() => downloadText("radiographic-note.txt", note || "")} className="rounded-2xl"><Download className="h-4 w-4 mr-2" /> Download .txt</Button>
            <Button variant="secondary" onClick={resetAll} className="rounded-2xl"><Trash2 className="h-4 w-4 mr-2" /> Clear</Button>
          </div>

          <Section title="Diagnostics (dev)" defaultOpen={false}>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowDiagnostics((s) => !s)}>
                {showDiagnostics ? "Hide" : "Show"} diagnostics
              </Button>
              <Button size="sm" onClick={runDiagnostics}>Run clipboard & export tests</Button>
            </div>
            {showDiagnostics && (
              <p className="text-xs text-muted-foreground mt-2">Runs a few checks (safeCopy, downloadText, buildNote). Results go to the browser console.</p>
            )}
          </Section>
        </div>

        {/* RIGHT: Preview */}
        <div className="space-y-4">
          <Card className="border rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Live Note Preview</CardTitle>
              <CardDescription>Auto-generated from your selections</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea ref={previewRef} value={note} className="min-h-[560px] font-mono text-sm" readOnly />
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button onClick={handleCopyNote} size="sm" className="rounded-xl"><Copy className="h-4 w-4 mr-2" /> Copy</Button>
                <Button onClick={() => handleCopyText(templates.blank, "skeleton")} size="sm" variant="secondary" className="rounded-xl"><PlusCircle className="h-4 w-4 mr-2" /> Insert blank skeleton</Button>
                <Button onClick={() => downloadText("radiographic-note.txt", note || "")} size="sm" variant="outline" className="rounded-xl"><Download className="h-4 w-4 mr-2" /> Download .txt</Button>
              </div>
            </CardContent>
          </Card>

          <QuickPhrases onPick={(text) => handleCopyText(text, "phrase")} />

          {scratch ? (
            <Card className="border rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Scratchpad (manual copy if clipboard is blocked)</CardTitle>
                <CardDescription>We saved the last item here so you can select and copy or download.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={scratch} onChange={(e) => setScratch(e.target.value)} className="min-h-[140px] font-mono text-sm" />
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" onClick={() => handleCopyText(scratch, "scratchpad")}><Copy className="h-4 w-4 mr-2" /> Copy</Button>
                  <Button size="sm" variant="secondary" onClick={() => downloadText("scratchpad.txt", scratch)}><Download className="h-4 w-4 mr-2" /> Download</Button>
                  <Button size="sm" variant="outline" onClick={() => setScratch("")}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------- Quick phrases & skeleton ----------
const templates = {
  blank: `Type of Image(s): \n\nImage Quality\n- Density/contrast: \n- Angulation/positioning: \n- Field of view (CBCT): \n- Artifacts: \n\nTeeth\n- Missing teeth: \n- Unerupted/impacted teeth: \n- Caries: \n- Existing restorations and prostheses: \n- Root morphology and resorption: \n\nTraumatic Dental Injuries\n- Ellis class: \n- Mobility/displacement: \n- Root fractures: \n\nPeriodontium\n- Alveolar bone height: \n- Bone pattern: \n- Calculus deposits: \n- Lamina dura: \n\nPeriapical / Periradicular\n- Trabecular pattern: \n- Periapical radiolucencies: \n- Periapical radiopacities: \n- Other osseous lesions: \n\nEndodontic Therapy\n- RCT quality: \n- Post & core: \n- Missed canals: \n- Root fracture/resorption: \n- Healing vs persistent RL: \n\nImplants\n- Location: \n- Osseointegration: \n- Marginal bone levels: \n- Angulation: \n- Complications: \n\nAnatomic Structures\n- Sinus: \n- Nasal cavity/septum: \n- Mandibular canal: \n- Mental foramen: \n- Incisive foramen: \n- TMJ: \n- Tonsilloliths: \n- Carotid calcifications: \n\nFractures\n- Mandible: \n- Maxilla: \n- Alveolar process: \n- Zygomatic/orbital: \n- Other: \n\nPathology / Abnormal Findings\n- \n\nCBCT\n- Volume: \n- Cross-sectional: \n- Alveolar metrics: \n- Cortical integrity: \n- IAN relation: \n- Sinus ostium/septa: \n- Airway: \n- Incidental: \n\nSummary / Impression\n- \n- DDX: `,
};

function QuickPhrases({ onPick }) {
  const chips = [
    "Generalized mild horizontal bone loss",
    "Localized vertical defect distal to #30",
    "Periapical radiolucency at #19 with well-defined borders",
    "Condensing osteitis adjacent to #3",
    "CBCT shows intact cortical plates; IAN canal separate",
    "Caries: #14 M-D, advanced; #18 O, moderate",
    "RCT #9 short by ~2 mm with voids",
    "Post well-adapted; no perforation visualized",
    "Crestal bone loss 2–3 mm around implant #8",
    "Tonsilloliths noted on the right",
    "Carotid calcifications bilaterally – recommend PCP referral",
  ];
  return (
    <Card className="border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Quick Phrases</CardTitle>
        <CardDescription>Click to copy common sentences you tweak per case</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Button key={c} size="sm" variant="outline" className="rounded-xl" onClick={() => onPick(c)}>
              {c}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
