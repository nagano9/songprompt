import { TEMPLATES } from "../src/lib/prompt/templates";
import { withDefaults } from "../src/lib/prompt/defaults";
import { generatePrompt } from "../src/lib/prompt/generator";
import { buildSuggestions, specificityScore } from "../src/lib/prompt/suggestions";

const folk = withDefaults({ ...TEMPLATES[0].input, lyrics: "Kertas kuning di laci lemari\nTulisanmu miring ke kanan\n\nAku masih menyimpan semua\nyang tak sempat kukirim\n\nBau minyak kayu putih\ndi jaket yang kau tinggal" });
for (const v of ["compact","standard","detailed"] as const) {
  const o = generatePrompt(folk, "suno", v);
  console.log(`\n===== SUNO ${v} =====`);
  for (const f of o.fields) console.log(`--- ${f.label} (${f.content.length}${f.limit?"/"+f.limit:""})\n${f.content}`);
}
console.log("\n===== GENERIC standard =====\n" + generatePrompt(folk,"generic","standard").fields[0].content);
const lofi = withDefaults(TEMPLATES[1].input);
console.log("\n===== LOFI udio standard =====");
for (const f of generatePrompt(lofi,"udio","standard").fields) console.log(`--- ${f.label}\n${f.content}`);
const bad = withDefaults({ genre: "pop", moods: ["sad","happy"], subgenres:["a","b","c"], instrumentsInclude:["piano"], instrumentsAvoid:["piano"], lyrics:"neon lights and shadows\nwe rise", references:"like Taylor Swift" });
console.log("\n===== BAD INPUT =====", specificityScore(bad));
for (const s of buildSuggestions(bad,"suno")) console.log(`[${s.level}] ${s.title}${s.actions? " -> "+s.actions.map(a=>a.label).join(" | "):""}`);
console.log("\nSCORES:", TEMPLATES.map(t=>`${t.name}=${specificityScore(withDefaults(t.input)).score}`).join(", "));
