import React, { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FullPageLayout } from "../components/FullPageLayout";
import { formatEther, parseEther } from "ethers";
import { api } from "../api";
import type { CatalogAsset, LicenseReceipt } from "../types";
import {
  getDeployment,
  getFaucet,
  getMarket,
  getSnd,
  isDeployed,
  LICENSE_NAMES,
  type Deployment,
} from "../web3/contracts";
import { setTargetChainId, useWallet } from "../web3/useWallet";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  AudioPlayer,
} from "../components/ui";
import { FileText, Download, Settings2, ShoppingCart } from "lucide-react";
import AssetCard from "../components/marketplace/AssetCard";
import { FilterPanel } from "../components/marketplace/FilterPanel";
import { ChevronDown, ChevronRight, Grid, List } from "lucide-react";

interface Listing {
  id: bigint;
  seller: string;
  name: string;
  assetUri: string;
  price: bigint;
  license: number;
  active: boolean;
  buyer: string;
  escrowed: bigint;
  released: boolean;
}

export interface Filters {
  q: string;
  genre: string;
  key: string;
  license: string;
  format: string;
  plugin: string;
  bpmMin: string;
  bpmMax: string;
}

const EMPTY_FILTERS: Filters = {
  q: "",
  genre: "",
  key: "",
  license: "",
  format: "",
  plugin: "",
  bpmMin: "",
  bpmMax: "",
};

function LicenseReceiptCard({ receipt }: { receipt: LicenseReceipt }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soundhub-license-${receipt.receipt_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const date = new Date(receipt.issued_at * 1000).toLocaleString();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <FileText size={20} className="mr-2" />License receipt
        </CardTitle>
        <CardContent>
          <Button variant="ghost" size="sm" onClick={download}>
            <Download size={14} className="mr-1" /> .json
          </Button>
        </CardContent>
      </CardHeader>
      <CardDescription>
        {receipt.asset_name} · {receipt.license}
      </CardDescription>
      <CardContent>
        <div className="receipt-scope">
          <div>
            <strong>You can:</strong> {receipt.buyer_can}
          </div>
          <div>
            <strong>Seller keeps:</strong> {receipt.seller_keeps}
          </div>
        </div>
        <dl className="receipt-facts">
          <div><dt>receipt</dt><dd>#{receipt.receipt_id} · v{receipt.version}</dd></div>
          <div><dt>date</dt><dd>{date}</dd></div>
          <div><dt>price</dt><dd>{receipt.price_snd} SND</dd></div>
          <div><dt>buyer</dt><dd className="mono">{receipt.buyer.slice(0, 8)}…{receipt.buyer.slice(-6)}</dd></div>
          <div><dt>seller</dt><dd className="mono">{receipt.seller.slice(0, 8)}…{receipt.seller.slice(-6)}</dd></div>
          <div><dt>asset sha256</dt><dd className="mono">{receipt.asset_sha256.slice(0, 16)}…</dd></div>
        </dl>
      </CardContent>
    </Card>
  );
}

function Waveform({
  peaks,
  progress,
  playing,
}: {
  peaks: number[];
  progress: number;
  playing: boolean;
}) {
  const bars = peaks.length ? peaks : Array.from({ length: 120 }, () => 12);
  return (
    <div className="waveform" aria-hidden="true">
      {bars.map((p, i) => (
        <span
          key={i}
          className={`wf-bar${playing && i / bars.length <= progress ? " played" : ""}`}
          style={{ height: `${Math.max(6, Math.round((p / 255) * 100))}%` }}
        />
      ))}
    </div>
  );
}

export default function MarketplacePage() {
  const wallet = useWallet();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sndBalance, setSndBalance] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<LicenseReceipt | null>(null);
  const [receiptErr, setReceiptErr] = useState<string | null>(null);

  // catalog browsing (public API — no wallet needed)
  const [catalog, setCatalog] = useState<CatalogAsset[]>([]);
  const [allAssets, setAllAssets] = useState<CatalogAsset[]>([]);
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS });
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // seller form
  const [lName, setLName] = useState("");
  const [lUri, setLUri] = useState("");
  const [lPrice, setLPrice] = useState("");
  const [lLicense, setLLicense] = useState("1");
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const ensureWallet = async (): Promise<boolean> => {
    if (!deployment) return false;
    setTargetChainId(deployment.chainId);
    if (!wallet.connected) await wallet.connect();
    if (wallet.chainId !== deployment.chainId) await wallet.switchToBase();
    return Boolean(wallet.provider);
  };

  const refresh = useCallback(async () => {
    const dep = await getDeployment();
    setDeployment(dep);
    if (!isDeployed(dep) || !dep.market || !dep.faucet || !wallet.provider || !wallet.address) return;
    try {
      const signer = await wallet.provider.getSigner();
      const snd = await getSnd(signer, dep.snd);
      setSndBalance(formatEther(await snd.balanceOf(wallet.address)));

      const market = await getMarket(signer, dep.market);
      const count = Number(await market.nextListingId());
      const rows: Listing[] = [];
      for (let i = 1; i < count; i++) {
        const l = await market.listings(i);
        rows.push({
          id: l.id,
          seller: l.seller,
          name: l.name,
          assetUri: l.assetUri,
          price: l.price,
          license: Number(l.license),
          active: l.active,
          buyer: l.buyer,
          escrowed: l.escrowed,
          released: l.released,
        });
      }
      setListings(rows.reverse());

      const faucet = await getFaucet(signer, dep.faucet);
      const [last, cooldown, latest] = await Promise.all([
        faucet.lastClaimAt(wallet.address),
        faucet.cooldown(),
        wallet.provider.getBlock("latest"),
      ]);
      setCanClaim(
        latest !== null && Number(last) + Number(cooldown) <= Number(latest.timestamp)
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load marketplace");
    }
  }, [wallet.provider, wallet.address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // full catalog for filter options
  useEffect(() => {
    api.catalog({ limit: 200 }).then(setAllAssets).catch(() => {});
  }, []);

  // stop preview audio on unmount
  useEffect(() => {
    return () => audioRef.current?.pause();
  }, []);

  // filtered catalog (debounced)
  useEffect(() => {
    const t = window.setTimeout(() => {
      api
        .catalog({
          q: filters.q || undefined,
          genre: filters.genre || undefined,
          key: filters.key || undefined,
          license: filters.license || undefined,
          format: filters.format || undefined,
          plugin: filters.plugin || undefined,
          bpm_min: filters.bpmMin || undefined,
          bpm_max: filters.bpmMax || undefined,
        })
        .then(setCatalog)
        .catch((e) =>
          setCatalogErr(e instanceof Error ? e.message : "Failed to load catalog")
        );
    }, 200);
    return () => window.clearTimeout(t);
  }, [filters]);

  const genreOptions = useMemo(
    () => [...new Set(allAssets.flatMap((a) => a.genres))].sort(),
    [allAssets]
  );
  const keyOptions = useMemo(
    () => [...new Set(allAssets.map((a) => a.key).filter(Boolean) as string[])].sort(),
    [allAssets]
  );
  const licenseOptions = useMemo(
    () => [...new Set(allAssets.map((a) => a.license))].sort(),
    [allAssets]
  );
  const formatOptions = useMemo(
    () => [...new Set(allAssets.map((a) => a.format).filter(Boolean) as string[])].sort(),
    [allAssets]
  );
  const pluginOptions = useMemo(
    () => [...new Set(allAssets.flatMap((a) => a.plugins))].sort(),
    [allAssets]
  );

  const onchainFor = (id: number) => listings.find((l) => Number(l.id) === id);

  const setFilter = (k: keyof Filters, v: string) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const resetFilters = () => setFilters({ ...EMPTY_FILTERS });

  const togglePlay = (a: CatalogAsset) => {
    if (playingId === a.listing_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setProgress(0);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(api.previewUrl(a.listing_id));
    audioRef.current = audio;
    setPlayingId(a.listing_id);
    setProgress(0);
    audio.ontimeupdate = () =>
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    audio.onended = () => {
      setPlayingId(null);
      setProgress(0);
    };
    audio.play().catch(() => setPlayingId(null));
  };

  const claimFaucet = async () => {
    setErr(null);
    setMsg(null);
    if (!deployment?.faucet) return;
    try {
      if (!(await ensureWallet())) return;
      const signer = await wallet.provider!.getSigner();
      const faucet = await getFaucet(signer, deployment.faucet);
      setBusy(true);
      await (await faucet.claim()).wait();
      setMsg("100 SND claimed! Buy something.");
      await refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  const buy = async (l: Listing) => {
    setErr(null);
    setMsg(null);
    if (!deployment?.market) return;
    try {
      if (!(await ensureWallet())) return;
      const signer = await wallet.provider!.getSigner();
      const snd = await getSnd(signer, deployment.snd);
      const market = await getMarket(signer, deployment.market);
      setBusy(true);
      await (await snd.approve(deployment.market, l.price)).wait();
      await (await market.buy(l.id)).wait();
      setMsg(`Bought "${l.name}" — SND is in escrow. Confirm receipt to pay the seller.`);
      await refresh();
      // ship the signed license receipt
      try {
        setReceiptErr(null);
        setReceipt(
          await api.issueReceipt(Number(l.id), wallet.address!, l.seller)
        );
      } catch (e3) {
        setReceipt(null);
        setReceiptErr(
          e3 instanceof Error ? e3.message : "License receipt unavailable"
        );
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Buy failed");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (l: Listing) => {
    setErr(null);
    setMsg(null);
    if (!deployment?.market) return;
    try {
      if (!(await ensureWallet())) return;
      const signer = await wallet.provider!.getSigner();
      const market = await getMarket(signer, deployment.market);
      setBusy(true);
      await (await market.confirmReceipt(l.id)).wait();
      setMsg(`Receipt confirmed — seller paid ✓`);
      await refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Confirm failed");
    } finally {
      setBusy(false);
    }
  };

  const listAsset = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!deployment?.market) return;
    try {
      const price = parseEther(lPrice || "0");
      if (price <= 0n) throw new Error("Enter a price in SND");
      if (!(await ensureWallet())) return;
      const signer = await wallet.provider!.getSigner();
      const market = await getMarket(signer, deployment.market);
      setBusy(true);
      await (await market.list(lName.trim(), lUri.trim() || "soundhub://asset", price, Number(lLicense))).wait();
      setMsg("Listed! Buyers can now purchase it with SND.");
      setLName("");
      setLUri("");
      setLPrice("");
      await refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Listing failed");
    } finally {
      setBusy(false);
    }
  };

  const deployed = deployment && isDeployed(deployment);
  const filteredCount = catalog.length;

  return (
    <FullPageLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'flex', gap: '16px' }}>
        {/* Filter Panel */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Filters</span>
                <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FilterPanel
                filters={filters}
                genreOptions={genreOptions}
                keyOptions={keyOptions}
                licenseOptions={licenseOptions}
                formatOptions={formatOptions}
                pluginOptions={pluginOptions}
                setFilter={setFilter}
                resetFilters={resetFilters}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          <Card>
            <CardHeader>
              <CardTitle>🛒 Marketplace</CardTitle>
              <CardDescription>
                Find it. Preview it. Drop it into your track. — finished sounds with clear
                commercial rights, paid for with SND.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* ---------- Catalog with Asset Cards (public) ---------- */}
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <CardTitle>Browse Assets</CardTitle>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
                      >
                        {view === 'grid' ? <List size={16} /> : <Grid size={16} />}
                      </Button>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {view === 'grid' ? 'List view' : 'Grid view'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {catalogErr && (
                    <div style={{ fontSize: '14px', color: 'red', marginTop: 10 }}>
                      {catalogErr}
                    </div>
                  )}

                  <p className="muted" style={{ margin: "14px 0 10px" }}>
                    {filteredCount} {filteredCount === 1 ? "asset" : "assets"}
                  </p>

                  <div className="grid asset-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {catalog.map((a) => {
                      const onchain = onchainFor(a.listing_id);
                      const sold = onchain ? onchain.escrowed > 0n : false;
                      const isMyListing =
                        onchain && wallet.address?.toLowerCase() === onchain.seller.toLowerCase();
                      const canBuy = Boolean(onchain && onchain.active && !sold && !isMyListing);
                      return (
                        <AssetCard
                          key={a.uri || a.listing_id}
                          asset={a}
                          isPlaying={playingId === a.listing_id}
                          onTogglePlay={togglePlay}
                          onAssetDetail={() => window.open(`/assets/${a.listing_id}`, "_blank")}
                          view={view}
                        />
                      );
                    })}
                  </div>

                  {catalog.length === 0 && !catalogErr && (
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                      No assets match — try wider filters.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ---------- On-chain sections (wallet required) ---------- */}
              {!deployed ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Notice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="muted">
                      Contracts not deployed yet — catalog preview is still available above.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <CardTitle>Listings & escrow</CardTitle>
                        <Button variant="ghost" size="sm" onClick={refresh} disabled={busy}>
                          ↻ refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {listings.length === 0 && (
                        <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
                          No assets listed yet. Be the first seller!
                        </div>
                      )}
                      {listings.map((l) => {
                        const isMyListing = wallet.address?.toLowerCase() === l.seller.toLowerCase();
                        const amBuyer = wallet.address?.toLowerCase() === l.buyer.toLowerCase();
                        const sold = l.escrowed > 0n;
                        return (
                          <Card
                            key={l.id.toString()}
                            variant="interactive"
                            onClick={() => window.open(`/listings/${l.id}`, "_blank")}
                            style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <CardContent>
                              <div className="file-row">
                                <span className="file-icon"><Settings2 size={14} /></span>
                                <div style={{ flex: 1 }}>
                                  <div>
                                    <strong>{l.name}</strong>{" "}
                                    <Badge variant="secondary">{LICENSE_NAMES[l.license]}</Badge>
                                    {isMyListing && <Badge variant="secondary">yours</Badge>}
                                  </div>
                                  <div className="muted" style={{ fontSize: 12, fontFamily: "monospace" }}>
                                    #{l.id.toString()} · {l.assetUri} · seller{" "}
                                    {l.seller.slice(0, 6)}…{l.seller.slice(-4)}
                                  </div>
                                </div>
                                <strong>{formatEther(l.price)} SND</strong>
                                {!sold && l.active && !isMyListing && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => buy(l)}
                                  >
                                    Buy
                                  </Button>
                                )}
                                {!sold && l.active && isMyListing && (
                                  <Badge variant="secondary">listed</Badge>
                                )}
                                {sold && !l.released && amBuyer && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => confirm(l)}
                                  >
                                    Confirm receipt
                                  </Button>
                                )}
                                {sold && !l.released && isMyListing && (
                                  <Badge
                                    variant="secondary"
                                    style={{ background: '#f5c54220', color: '#f5c542' }}
                                  >
                                    in escrow
                                  </Badge>
                                )}
                                {l.released && <Badge variant="secondary">settled</Badge>}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sell a finished sound</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="card" onSubmit={listAsset}>
                        <div className="row" style={{ gap: 8 }}>
                          <div>
                            <Input
                              label="Name"
                              placeholder="e.g. 'Dark Bass Patch (Serum)'"
                              value={lName}
                              onChange={(e) => setLName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Input
                              label="Price in SND"
                              value={lPrice}
                              onChange={(e) => setLPrice(e.target.value)}
                              style={{ width: 120 }}
                            />
                          </div>
                          <div>
                            <select
                              value={lLicense}
                              onChange={(e) => setLLicense(e.target.value)}
                              style={{
                                background: "var(--bg3)",
                                color: "var(--text)",
                                border: "1px solid var(--border)",
                                borderRadius: 8,
                                padding: "9px 12px",
                              }}
                            >
                              {LICENSE_NAMES.map((n, i) => (
                                <option key={n} value={i}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <Input
                          label="Asset URI"
                          placeholder="Asset URI (repo path or IPFS), e.g. soundhub://presets/dark-bass"
                          value={lUri}
                          onChange={(e) => setLUri(e.target.value)}
                        />
                        <div className="row" style={{ marginTop: 10 }}>
                          <div className="muted" style={{ fontSize: 12 }}>
                            Wallet:{' '}
                            {wallet.address ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : "not connected"}
                          </div>
                          <div className="spacer" />
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={busy}
                            onClick={listAsset}
                          >
                            {busy ? "…" : "List for SND"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Wallet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {wallet.address ? `${sndBalance ?? "…"} SND` : "connect wallet"}
                      </div>
                      <div className="row" style={{ marginTop: 12 }}>
                        {!wallet.connected && (
                          <Button variant="primary" onClick={() => wallet.connect()}>
                            Connect wallet
                          </Button>
                        )}
                        {wallet.connected && !canClaim && (
                          <Badge variant="secondary">claimed recently</Badge>
                        )}
                        {wallet.connected && canClaim && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={claimFaucet}
                            disabled={busy}
                          >
                            Claim 100 SND (testnet)
                          </Button>
                        )}
                      </div>
                      {msg && (
                        <div style={{ fontSize: '14px', background: '#4CAF5020', color: '#4CAF50', padding: '8px', borderRadius: 4 }}>
                          {msg}
                        </div>
                      )}
                      {err && (
                        <div style={{ fontSize: '14px', background: '#F4433620', color: '#F44336', padding: '8px', borderRadius: 4 }}>
                          {err}
                        </div>
                      )}
                      {receiptErr && (
                        <div style={{ fontSize: '14px', background: '#F4433620', color: '#F44336', padding: '8px', borderRadius: 4 }}>
                          {receiptErr}
                        </div>
                      )}
                      {receipt && <LicenseReceiptCard receipt={receipt} />}
                      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
                        Testnet faucet: 100 SND per wallet per day — enough to try
                        buying a preset.
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </FullPageLayout>
  );
}