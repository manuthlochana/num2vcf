import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useMemo, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import {
  ShieldCheck, Upload, Download, Copy, RotateCcw, ListOrdered, CheckCircle2, XCircle, CopyX, Contact, ChevronLeft, ChevronRight, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { processInput, buildVCard, type FormatMode, type Separator, type Status } from "@/lib/vcard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Batch Phone to vCard Converter — Private VCF Generator" },
      { name: "description", content: "Clean, de-duplicate and convert thousands of phone numbers into a vCard 3.0 .VCF file, 100% in your browser." },
      { property: "og:title", content: "Batch Phone to vCard Converter" },
      { property: "og:description", content: "Sanitize and convert phone lists to .VCF contacts instantly — nothing leaves your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PAGE = 100;
const PREVIEW_CARDS = 200;

function Index() {
  const [text, setText] = useState("");
  const [prefix, setPrefix] = useState("Contact");
  const [counter, setCounter] = useState(true);
  const [startIndex, setStartIndex] = useState(1);
  const [separator, setSeparator] = useState<Separator>("_");
  const [pad, setPad] = useState(0);
  const [mode, setMode] = useState<FormatMode>("original");
  const [countryCode, setCountryCode] = useState("94");
  const [dedupe, setDedupe] = useState(true);
  const [page, setPage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gutterRef = useRef<HTMLPreElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const deferredText = useDeferredValue(text);
  const result = useMemo(
    () => processInput(deferredText, { prefix, counter, startIndex, separator, pad, mode, countryCode, dedupe }),
    [deferredText, prefix, counter, startIndex, separator, pad, mode, countryCode, dedupe],
  );
  const { rows, stats, vcf } = result;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const curPage = Math.min(page, pages - 1);
  const lineCount = Math.max(1, text.split("\n").length);
  const gutter = useMemo(() => Array.from({ length: Math.min(lineCount, 100000) }, (_, i) => i + 1).join("\n"), [lineCount]);
  const vcfPreview = useMemo(() => {
    const valid = rows.filter((r) => r.status === "valid").slice(0, PREVIEW_CARDS);
    return valid.map((r) => buildVCard(r.name, r.phone)).join("\n");
  }, [rows]);

  const readFile = async (file: File) => {
    if (!/\.(txt|csv)$/i.test(file.name)) {
      toast.error("Only .txt and .csv files are supported");
      return;
    }
    const content = await file.text();
    setText((t) => (t.trim() ? t.replace(/\n*$/, "\n") : "") + content);
    toast.success(`Loaded ${file.name}`);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  };

  const download = async () => {
    const safe = (prefix.trim() || "contacts").replace(/[^\w-]+/g, "_");
    const filename = `contacts_${safe}_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.vcf`;

    // 1. Native Web Share API as Primary on Mobile (iOS / iPadOS WebKit)
    // Allows sharing directly to WhatsApp, Messages, AirDrop, or "Save to Files"
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    ) {
      try {
        const file = new File([vcf], filename, { type: "text/vcard;charset=utf-8" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: filename });
          toast.success(`Exported ${stats.valid.toLocaleString()} contacts`);
          return;
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          // User dismissed the native share sheet without picking an app.
          // Proceed to fallback binary download without showing an error toast.
        } else {
          console.warn("Web Share failed, proceeding with binary download fallback:", error);
        }
      }
    }

    // 2. Robust Fallback (Desktop / Non-WebShare browsers / Share sheet cancelled)
    // Force a binary download via a hidden <a> tag with application/octet-stream
    // to prevent Mobile Safari / WebKit from intercepting the file into CNContactViewController.
    try {
      const blob = new Blob([vcf], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${stats.valid.toLocaleString()} contacts`);
    } catch (error) {
      console.error("Binary download failed:", error);
      toast.error("Failed to download contacts file");
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(vcf);
    toast.success("VCF copied to clipboard");
  };
  const reset = () => {
    setText(""); setPrefix("Contact"); setCounter(true); setStartIndex(1); setSeparator("_"); setPad(0);
    setMode("original"); setCountryCode("94"); setDedupe(true); setPage(0);
    toast("Everything cleared");
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Contact className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Phone → <span className="text-gradient-primary">vCard</span> Converter
              </h1>
              <p className="text-sm text-muted-foreground">Clean, de-duplicate and export thousands of numbers as a .VCF file.</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="w-fit gap-1.5 border-primary/40 bg-accent px-3 py-1.5 text-accent-foreground">
                <ShieldCheck className="size-4" /> 100% Client-Side Processing
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Your numbers never leave this browser tab.</TooltipContent>
          </Tooltip>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={ListOrdered} label="Total lines" value={stats.total} tone="text-foreground" />
          <Stat icon={CheckCircle2} label="Valid numbers" value={stats.valid} tone="text-success" />
          <Stat icon={XCircle} label="Invalid / ignored" value={stats.invalid} tone="text-destructive" />
          <Stat icon={CopyX} label="Duplicates dropped" value={stats.duplicates} tone="text-warning" />
        </section>

        <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact naming</CardTitle>
                <CardDescription>Preview: <span className="font-mono text-primary">{rows.find((r) => r.status === "valid")?.name ?? (prefix || "Contact")}</span></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Base name / prefix</Label>
                  <Input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. Lead, Batch 2026" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="counter">Add sequential counter</Label>
                  <Switch id="counter" checked={counter} onCheckedChange={setCounter} />
                </div>
                {counter && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Start</Label>
                      <Input type="number" min={0} value={startIndex} onChange={(e) => setStartIndex(Math.max(0, Number(e.target.value) || 0))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Separator</Label>
                      <Select value={separator} onValueChange={(v) => setSeparator(v as Separator)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_">_</SelectItem>
                          <SelectItem value="-"> - </SelectItem>
                          <SelectItem value=" ">space</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Padding</Label>
                      <Select value={String(pad)} onValueChange={(v) => setPad(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">1</SelectItem>
                          <SelectItem value="2">01</SelectItem>
                          <SelectItem value="3">001</SelectItem>
                          <SelectItem value="4">0001</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cleaning & format</CardTitle>
                <CardDescription>Brackets, dashes, spaces and other symbols are removed automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Number format</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as FormatMode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">Keep original (cleaned)</SelectItem>
                      <SelectItem value="lk">Sri Lanka international (+94)</SelectItem>
                      <SelectItem value="custom">Custom country code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mode === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="cc">Country code</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">+</span>
                      <Input id="cc" inputMode="numeric" value={countryCode} onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, "").slice(0, 4))} className="font-mono" />
                    </div>
                    <p className="text-xs text-muted-foreground">Leading zeros are stripped before the code is added.</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="dedupe">Remove duplicates</Label>
                    <Tooltip>
                      <TooltipTrigger asChild><Info className="size-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Compares numbers after cleaning and formatting.</TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch id="dedupe" checked={dedupe} onCheckedChange={setDedupe} />
                </div>
                <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">Numbers with fewer than 9 or more than 15 digits are flagged as invalid and skipped.</p>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">Phone numbers</CardTitle>
                  <CardDescription>Paste from Excel, Sheets, CSV or plain text — one per line.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload /> Upload
                </Button>
                <input ref={fileRef} type="file" accept=".txt,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`relative flex h-80 overflow-hidden rounded-lg border bg-background font-mono text-sm transition-colors ${dragging ? "border-primary ring-2 ring-primary/40" : ""}`}
                >
                  <pre ref={gutterRef} aria-hidden className="select-none overflow-hidden border-r bg-muted/50 px-3 py-3 text-right leading-6 text-muted-foreground">{gutter}</pre>
                  <textarea
                    value={text}
                    onChange={(e) => { setText(e.target.value); setPage(0); }}
                    onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }}
                    spellCheck={false}
                    wrap="off"
                    placeholder={"0771234567\n+94 (77) 123-4568\n\"Jane\",077-123-4569\n\n…or drop a .txt / .csv file here"}
                    className="flex-1 resize-none bg-transparent px-3 py-3 leading-6 outline-none placeholder:text-muted-foreground/60"
                  />
                  {dragging && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/80 font-sans text-primary">
                      <Upload className="mr-2 size-5" /> Drop .txt or .csv file
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <Tabs defaultValue="table">
                <CardHeader className="flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <TabsList>
                    <TabsTrigger value="table">Table view</TabsTrigger>
                    <TabsTrigger value="vcf">Raw VCF</TabsTrigger>
                  </TabsList>
                  <div className="flex flex-wrap gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={!text && prefix === "Contact"}><RotateCcw /> Reset</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear everything?</AlertDialogTitle>
                          <AlertDialogDescription>This removes all pasted numbers and resets your settings.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={reset}>Clear all</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" size="sm" onClick={copy} disabled={!vcf}><Copy /> Copy</Button>
                    <Button size="sm" onClick={download} disabled={!vcf} className="bg-gradient-primary shadow-glow">
                      <Download /> Download .VCF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="table" className="mt-0">
                    {rows.length === 0 ? (
                      <Empty />
                    ) : (
                      <>
                        <div className="max-h-[28rem] overflow-auto rounded-lg border">
                          <Table>
                            <TableHeader className="sticky top-0 bg-card">
                              <TableRow>
                                <TableHead className="w-14">#</TableHead>
                                <TableHead>Contact name</TableHead>
                                <TableHead>Original</TableHead>
                                <TableHead>Sanitized</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rows.slice(curPage * PAGE, curPage * PAGE + PAGE).map((r) => (
                                <TableRow key={r.index}>
                                  <TableCell className="font-mono text-muted-foreground">{r.index}</TableCell>
                                  <TableCell className="font-medium">{r.name || <span className="text-muted-foreground">—</span>}</TableCell>
                                  <TableCell className="max-w-48 truncate font-mono text-xs text-muted-foreground">{r.original}</TableCell>
                                  <TableCell className="font-mono">{r.phone || "—"}</TableCell>
                                  <TableCell className="text-right"><StatusBadge status={r.status} /></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                          <span>Showing {(curPage * PAGE + 1).toLocaleString()}–{Math.min(rows.length, (curPage + 1) * PAGE).toLocaleString()} of {rows.length.toLocaleString()}</span>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="size-8" disabled={curPage === 0} onClick={() => setPage(curPage - 1)} aria-label="Previous page"><ChevronLeft /></Button>
                            <span className="font-mono">{curPage + 1}/{pages}</span>
                            <Button variant="outline" size="icon" className="size-8" disabled={curPage >= pages - 1} onClick={() => setPage(curPage + 1)} aria-label="Next page"><ChevronRight /></Button>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  <TabsContent value="vcf" className="mt-0">
                    {vcf ? (
                      <>
                        <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-background p-4 font-mono text-xs leading-5 text-accent-foreground">{vcfPreview}</pre>
                        {stats.valid > PREVIEW_CARDS && (
                          <p className="mt-2 text-xs text-muted-foreground">Previewing first {PREVIEW_CARDS} of {stats.valid.toLocaleString()} contacts — the download includes all of them.</p>
                        )}
                      </>
                    ) : <Empty />}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof ListOrdered; label: string; value: number; tone: string }) {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg bg-muted p-2 ${tone}`}><Icon className="size-5" /></div>
        <div>
          <div className={`font-display text-2xl font-semibold tabular-nums ${tone}`}>{value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    valid: "border-success/40 bg-success/10 text-success",
    invalid: "border-destructive/40 bg-destructive/10 text-destructive",
    duplicate: "border-warning/40 bg-warning/10 text-warning",
  } as const;
  return <Badge variant="outline" className={`capitalize ${map[status]}`}>{status}</Badge>;
}

function Empty() {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
      <Contact className="size-6" />
      Paste numbers above to see your contacts here.
    </div>
  );
}
