import { useEffect, useMemo, useState } from "react";

type Table = { id: string; name: string; status: string };
type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryLabel?: string;
  extraSummary?: string;
  category?: { code: string; name: string };
};
type SalesMode = "quick" | "table" | "package";
type KitchenItem = {
  id: string;
  productName: string;
  quantity: number;
  status: string;
};
type Sales = {
  closedOrderCount: number;
  openOrderCount: number;
  grossSales: number;
  collectedAmount: number;
};
type Session = { id: string; tableId: string; status: string };
type Payment = { id: string; method: string; amount: number };
type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  lineTotal: number;
};
type Order = {
  id: string;
  sessionId: string;
  status: string;
  total: number;
  paidTotal?: number;
  items: OrderItem[];
  payments?: Payment[];
};
type AuthRole = { id: string; code: string; name: string };
type AuthPermission = { id: string; code: string; name: string };
type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  roles: AuthRole[];
  permissions: AuthPermission[];
};
type StoredAuth = { accessToken: string; user: AuthUser };
type LoginResponse = StoredAuth;

const API = "http://localhost:3000/v1";
const AUTH_STORAGE_KEY = "resto-pos-auth";

let authToken = "";

const setAuthToken = (token: string) => {
  authToken = token;
};

const readStoredAuth = () => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const persistAuth = (value: StoredAuth | null) => {
  if (typeof window === "undefined") return;

  if (value) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

const readErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // Ignore parse failures and fall back to the generic message.
  }

  return fallback;
};

const request = async <T,>(path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(API + path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `${init.method ?? "GET"} failed: ${path}`),
    );
  }

  return response.json() as Promise<T>;
};

const money = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

const get = async <T,>(path: string) => request<T>(path);

const post = async <T,>(path: string, body: unknown) =>
  request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

export default function App() {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kitchen, setKitchen] = useState<KitchenItem[]>([]);
  const [sales, setSales] = useState<Sales | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [salesMode, setSalesMode] = useState<SalesMode>("quick");
  const [activeSubTab, setActiveSubTab] = useState<"primary" | "secondary" | "tertiary" | "quaternary">("primary");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [auth, setAuth] = useState<StoredAuth | null>(() => {
    const stored = readStoredAuth();
    if (stored?.accessToken) setAuthToken(stored.accessToken);
    return stored;
  });
  const [authChecking, setAuthChecking] = useState(() =>
    Boolean(readStoredAuth()?.accessToken),
  );
  const [loginEmail, setLoginEmail] = useState(
    () => readStoredAuth()?.user.email ?? "admin@resto.local",
  );
  const [loginPassword, setLoginPassword] = useState("Admin123!");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const loadOperationalData = async () => {
    const [kitchenData, ordersData] = await Promise.all([
      get<KitchenItem[]>("/orders/kitchen"),
      get<Order[]>("/orders"),
    ]);
    setKitchen(kitchenData);
    setOrders(ordersData);
  };

  const load = async (includeOperational = false) => {
    const [tablesData, productsData, salesData, sessionsData] =
      await Promise.all([
        get<Table[]>("/dining/tables"),
        get<Product[]>("/catalog/products"),
        get<Sales>("/orders/sales-summary"),
        get<Session[]>("/dining/sessions"),
      ]);
    setTables(tablesData);
    setProducts(productsData);
    setSales(salesData);
    setSessions(sessionsData);
    setSelectedTableId((current) => current ?? tablesData[0]?.id ?? null);

    const operationalTask = loadOperationalData();
    if (includeOperational) {
      await operationalTask;
    } else {
      void operationalTask.catch(() => undefined);
    }
  };

  useEffect(() => {
    if (!auth?.accessToken) {
      setAuthToken("");
      setAuthChecking(false);
      return;
    }

    let active = true;
    setAuthToken(auth.accessToken);
    setAuthChecking(true);

    void get<AuthUser>("/auth/me")
      .then((user) => {
        if (!active) return;
        const nextAuth = { accessToken: auth.accessToken, user };
        persistAuth(nextAuth);
        setAuth(nextAuth);
        setLoginEmail(user.email);
        setLoginError("");
      })
      .catch(() => {
        if (!active) return;
        setAuthToken("");
        persistAuth(null);
        setAuth(null);
        setNotice("");
        setError("");
        setLoginError("Oturum suresi doldu. Lutfen tekrar giris yap.");
      })
      .finally(() => {
        if (active) setAuthChecking(false);
      });

    return () => {
      active = false;
    };
  }, [auth?.accessToken]);

  useEffect(() => {
    if (!auth?.accessToken || authChecking) return;

    void load().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Yukleme hatasi"),
    );
    const timer = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [auth?.accessToken, authChecking]);

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );
  const openSession = useMemo(
    () =>
      sessions.find(
        (session) =>
          session.tableId === selectedTableId && session.status === "OPEN",
      ) ?? null,
    [selectedTableId, sessions],
  );
  const openOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          order.sessionId === openSession?.id && order.status === "OPEN",
      ) ?? null,
    [openSession, orders],
  );
  const occupiedTableCount = useMemo(
    () => tables.filter((table) => table.status === "OCCUPIED").length,
    [tables],
  );
  const openOrderCount = sales?.openOrderCount ?? 0;
  const grossSalesLabel = money.format(sales?.grossSales ?? 0);
  const paidTotal = openOrder?.paidTotal ?? 0;
  const remainingTotal = Math.max((openOrder?.total ?? 0) - paidTotal, 0);
  const currentTotalLabel = money.format(openOrder?.total ?? 0);
  const paidTotalLabel = money.format(paidTotal);
  const remainingTotalLabel = money.format(remainingTotal);
  const demoProductId = products[0]?.id ?? "";

  const featuredProducts =
    products.length > 1
      ? products.slice(0, 5)
      : [
          {
            ...products[0],
            id: demoProductId,
            name: "Karisik Sandvic",
            price: 129,
            description: "Hindi fume ve ozel sos",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "Vejetaryen Sandvic",
            price: 139,
            description: "Izgara sebze ve pesto",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "Tahinli Pogaca",
            price: 79,
            description: "Firindan yeni cikan urun",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "Cikolatali Kruvasan",
            price: 114,
            description: "Tereyagli ve cikolatali",
          },
        ];
  const coffeeProducts =
    products.length > 5
      ? products.slice(5, 10)
      : [
          {
            ...products[0],
            id: demoProductId,
            name: "Caramel Latte",
            price: 159,
            description: "Buyuk boy ve ekstra surup",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "White Americano",
            price: 119,
            description: "2 kahve alana 40 indirim",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "White Mocha",
            price: 159,
            description: "Beyaz cikolata ve espresso",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "Espresso",
            price: 94,
            description: "Yogun aromali tek cekim",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "Double Espresso",
            price: 109,
            description: "Cift shot espresso",
          },
          {
            ...products[0],
            id: demoProductId,
            name: "Americano",
            price: 129,
            description: "Uzatilmis espresso",
          },
        ];
  const pastryProducts = products.slice(10, 15);
  const teaProducts = products.filter((product) => product.category?.code === "TEA");
  const tableExtraProducts = products.filter((product) => product.category?.code === "ekstralar");
  const packageProducts = products.filter((product) => product.category?.code === "PACKAGED");
  const quickFeaturedProducts = products
    .filter((product) => product.category?.code === "atistirmaliklar")
    .slice(0, 5);
  const quickCoffeeProducts = products
    .filter((product) => product.category?.code === "kahveler")
    .slice(0, 6);
  const quickDessertProducts = products.filter(
    (product) => product.category?.code === "DESSERT",
  );
  const tableFavoriteProducts = [
    ...quickFeaturedProducts.slice(0, 3),
    ...quickCoffeeProducts.slice(0, 3),
  ];
  const salesModeLabel =
    salesMode === "quick"
      ? "Hizli Satis"
      : salesMode === "table"
        ? "Masa"
        : "Paket";
  const channelContextLabel =
    salesMode === "quick"
      ? "Servis Tezgahi"
      : salesMode === "table"
        ? (selectedTable?.name ?? "Masa Sec")
        : "Kurye Teslim";
  const catalogTitle =
    salesMode === "quick"
      ? "Gune Baslarken"
      : salesMode === "table"
        ? "Masa Servisi"
        : "Paket Siparis";
  const catalogPrimaryBadge =
    salesMode === "quick"
      ? "Tezgah Akisi"
      : salesMode === "table"
        ? "Salon Akisi"
        : "Kurye Akisi";
  const activeSubTabHint =
    salesMode === "quick"
      ? "Hizli satis icin vitrin secimleri"
      : salesMode === "table"
        ? "Masa servisine uygun urun akisi"
        : "Paket hazirlama ve teslim odakli secimler";
  const ticketActionLabel =
    salesMode === "quick"
      ? "Tezgah Islemi"
      : salesMode === "table"
        ? "Masa Operasyonu"
        : "Kurye Operasyonu";
  const paymentPanelLabel =
    salesMode === "quick"
      ? "Hizli Tahsilat"
      : salesMode === "table"
        ? "Masa Tahsilati"
        : "Paket Tahsilati";
  const paymentPanelHint =
    salesMode === "quick"
      ? "Nakit veya kart ile tek adim tahsilat"
      : salesMode === "table"
        ? "Adisyonu kapatmadan once odeme al"
        : "Teslimat oncesi odeme yontemini netlestir";
  const closeOrderLabel =
    salesMode === "quick"
      ? "Satisi Kapat"
      : salesMode === "table"
        ? "Masayi Kapat"
        : "Paketi Kapat";
  const primaryMenuProducts =
    salesMode === "quick"
      ? (quickFeaturedProducts.length ? quickFeaturedProducts : featuredProducts)
      : salesMode === "table"
        ? (tableFavoriteProducts.length ? tableFavoriteProducts : featuredProducts)
        : packageProducts;
  const secondaryMenuProducts =
    salesMode === "quick"
      ? (quickCoffeeProducts.length ? quickCoffeeProducts : coffeeProducts)
      : salesMode === "table"
        ? coffeeProducts
        : featuredProducts;
  const tertiaryMenuProducts =
    salesMode === "quick"
      ? teaProducts
      : salesMode === "table"
        ? (quickDessertProducts.length ? quickDessertProducts : pastryProducts.length ? pastryProducts : featuredProducts)
        : coffeeProducts;
  const quaternaryMenuProducts =
    salesMode === "quick"
      ? (quickDessertProducts.length ? quickDessertProducts : pastryProducts.length ? pastryProducts : featuredProducts)
      : salesMode === "table"
        ? tableExtraProducts
        : (quickDessertProducts.length ? quickDessertProducts : pastryProducts.length ? pastryProducts : featuredProducts);
  const activeSubTabLabel =
    activeSubTab === "primary"
      ? salesMode === "quick"
        ? "Atistirmaliklar"
        : salesMode === "table"
          ? "Masa Favorileri"
          : "Hazir Paketler"
      : activeSubTab === "secondary"
        ? salesMode === "quick"
          ? "Kahveler"
          : salesMode === "table"
            ? "Kahveler"
            : "Atistirmaliklar"
        : activeSubTab === "tertiary"
          ? salesMode === "quick"
            ? "Bitki Caylari"
            : salesMode === "table"
              ? "Tatlilar"
              : "Kahveler"
          : salesMode === "quick"
            ? "Tatli"
            : salesMode === "table"
              ? "Ekstralar"
              : "Tatlilar";
  const activeSubTabProducts =
    activeSubTab === "primary"
      ? primaryMenuProducts
      : activeSubTab === "secondary"
        ? secondaryMenuProducts
        : activeSubTab === "tertiary"
          ? tertiaryMenuProducts
          : quaternaryMenuProducts;

  useEffect(() => {
    setActiveSubTab("primary");
  }, [salesMode]);

  const resetOperationalState = () => {
    setTables([]);
    setProducts([]);
    setKitchen([]);
    setSales(null);
    setSessions([]);
    setOrders([]);
    setSelectedTableId(null);
    setNotice("");
    setError("");
  };

  const handleLogin = async () => {
    try {
      setLoginBusy(true);
      setLoginError("");
      const nextAuth = await post<LoginResponse>("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      setAuthToken(nextAuth.accessToken);
      persistAuth(nextAuth);
      setAuth(nextAuth);
      setNotice("");
      setError("");
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : "Giris yapilamadi");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    persistAuth(null);
    setAuth(null);
    setAuthChecking(false);
    setLoginError("");
    resetOperationalState();
  };

  const runAction = async (action: () => Promise<void>) => {
    try {
      setBusy(true);
      setError("");
      setNotice("");
      await action();
      await load(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Islem basarisiz");
    } finally {
      setBusy(false);
    }
  };

  const openTableSession = async () => {
    if (!selectedTable) return;
    await runAction(async () => {
      const session = await post<Session>("/dining/sessions/open", {
        tableId: selectedTable.id,
        guestCount: 2,
        note: "POS ekranindan acildi",
      });
      setNotice("Session acildi: " + session.id);
    });
  };

  const ensureOpenOrder = async () => {
    let session = openSession;
    if (!session) {
      const fallbackTable = selectedTable ?? tables[0];
      if (!fallbackTable) throw new Error("Sistem masasi bulunamadi");
      session = await post<Session>("/dining/sessions/open", {
        tableId: fallbackTable.id,
        guestCount: 1,
        note: "Hizli satis otomatik oturumu",
      });
    }
    if (openOrder) return openOrder;
    return post<Order>("/orders", {
      sessionId: session.id,
      note: "POS ekranindan baslatildi",
    });
  };

  const startOrder = async () => {
    await runAction(async () => {
      const order = await ensureOpenOrder();
      setNotice("Siparis hazir: " + order.id);
    });
  };
  const addProduct = async (product: Product) => {
    if (!product.id) {
      setError("Gecerli urun bulunamadi");
      return;
    }
    await runAction(async () => {
      const order = await ensureOpenOrder();
      await post<Order>("/orders/items", {
        orderId: order.id,
        productId: product.id,
        quantity: 1,
      });
      setNotice(product.name + " eklendi");
    });
  };

  const updateItemQuantity = async (orderItemId: string, quantity: number) => {
    await runAction(async () => {
      await post<Order>("/orders/items/update", { orderItemId, quantity });
      setNotice("Adisyon guncellendi");
    });
  };

  const removeItem = async (orderItemId: string) => {
    await runAction(async () => {
      await post<Order>("/orders/items/remove", { orderItemId });
      setNotice("Kalem silindi");
    });
  };

  const addRemainingPayment = async (method: "CASH" | "CARD") => {
    if (!openOrder) return;
    if (remainingTotal <= 0) {
      setNotice("Kalan tutar yok");
      return;
    }
    await runAction(async () => {
      await post<Order>("/orders/payments", {
        orderId: openOrder.id,
        method,
        amount: remainingTotal,
        note: "POS ekranindan tahsil edildi",
      });
      setNotice(
        method === "CASH" ? "Nakit tahsil edildi" : "Kart odemesi alindi",
      );
    });
  };

  const renderProductCard = (product: Product) => (
    <button
      key={product.name + product.id}
      type="button"
      className="product-card"
      disabled={busy}
      onClick={() => void addProduct(product)}
    >
      <strong>{product.name}</strong>
      <span>{product.description ?? "Urun grubu"}</span>
      <small>{[(product.categoryLabel ?? activeSubTabLabel), (product.extraSummary ?? catalogPrimaryBadge)].filter(Boolean).join(" • ")}</small>
      <b>{money.format(product.price)}</b>
    </button>
  );

  const closeCurrentOrder = async () => {
    if (!openOrder) return;
    if (remainingTotal > 0) {
      setError("Siparis kapatmak icin once kalan tutari tahsil et");
      return;
    }
    await runAction(async () => {
      await post<Order>("/orders/close", {
        orderId: openOrder.id,
        note: "POS ekranindan kapatildi",
      });
      setNotice("Adisyon kapatildi");
    });
  };

  const currentUserName = auth?.user.fullName || auth?.user.email || "Kasa";
  const currentUserRole = auth?.user.roles[0]?.name ?? "Yetkili Kullanici";

  if (authChecking) {
    return (
      <main className="page login-screen">
        <section className="login-card loading-card">
          <p>Resto POS</p>
          <h1>Oturum dogrulaniyor</h1>
          <span>Yerel kasa oturumu kontrol ediliyor...</span>
        </section>
      </main>
    );
  }

  if (!auth) {
    return (
      <main className="page login-screen">
        <section className="login-card">
          <p>Resto POS</p>
          <h1>Kasa Girisi</h1>
          <span>Satis ekranina gecmek icin yetkili kullanici ile oturum ac.</span>
          {loginError ? <div className="error">{loginError}</div> : null}
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleLogin();
            }}
          >
            <label className="login-field">
              <span>E-posta</span>
              <input
                className="login-input"
                type="email"
                autoComplete="username"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                disabled={loginBusy}
              />
            </label>
            <label className="login-field">
              <span>Sifre</span>
              <input
                className="login-input"
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                disabled={loginBusy}
              />
            </label>
            <button className="primary login-submit" type="submit" disabled={loginBusy}>
              {loginBusy ? "Giris yapiliyor..." : "Giris Yap"}
            </button>
          </form>
          <div className="login-note">
            <strong>Varsayilan hesap</strong>
            <span>admin@resto.local / Admin123!</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page simpra-shell">
      <header className="hero simpra-hero">
        <div className="hero-copy">
          <p>Resto POS</p>
          <h1>Salon Satis Ekrani</h1>
          <span>Masalar, adisyon ve hizli urun akisi tek ekranda</span>
        </div>
        <div className="hero-actions">
          <div className="session-chip">
            <small>{currentUserRole}</small>
            <strong>{currentUserName}</strong>
            <span>{auth.user.email}</span>
          </div>
          <button
            className="primary top-refresh"
            disabled={busy}
            onClick={() => void load(true)}
          >
            Yenile
          </button>
          <button className="secondary top-refresh" type="button" onClick={handleLogout}>
            Cikis
          </button>
        </div>
      </header>
      {notice ? <div className="notice">{notice}</div> : null}
      {error ? <div className="error">{error}</div> : null}
      <section className="stats">
        <article>
          <span>Toplam Masa</span>
          <strong>{tables.length}</strong>
        </article>
        <article>
          <span>Dolu Masa</span>
          <strong>{occupiedTableCount}</strong>
        </article>
        <article>
          <span>Acik Siparis</span>
          <strong>{openOrderCount}</strong>
        </article>
        <article>
          <span>Gunluk Satis</span>
          <strong>{grossSalesLabel}</strong>
        </article>
      </section>
      <section className="layout">
        <section
          className={
            salesMode === "table"
              ? "panel tables-panel visible"
              : "panel tables-panel"
          }
        >
          <h2>Masalar</h2>
          <div className="list">
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                className={
                  selectedTableId === table.id
                    ? "table-card active"
                    : "table-card"
                }
                onClick={() => setSelectedTableId(table.id)}
              >
                <strong>{table.name}</strong>
                <span>{table.status}</span>
              </button>
            ))}
          </div>
        </section>
        <section className={`panel order-panel ${salesMode}-mode`}>
          <div className="pos-ticket-head">
            <div className="ticket-head-left">
              <button type="button" className="icon-chip">
                x
              </button>
              <div className="ticket-ref-wrap">
                <small>{ticketActionLabel}</small>
                <span className="ticket-ref">
                  #{openOrder?.id.slice(-4) ?? "128"} / {salesModeLabel}
                </span>
              </div>
            </div>
            <div className="ticket-head-right">
              {openOrder?.items.length ?? 0}
            </div>
          </div>
          <div className="order-head">
            <button type="button" className="sidebar-tab active">
              Yeni
            </button>
            <button type="button" className="sidebar-tab">
              Gecmis
            </button>
          </div>
          <div className="ticket-summary">
            <div className="ticket-summary-row">
              <span>Kanal</span>
              <strong>{salesModeLabel}</strong>
            </div>
            <div className="ticket-summary-row">
              <span>Baglam</span>
              <strong>{channelContextLabel}</strong>
            </div>
            <div className="ticket-summary-row">
              <span>Siparis</span>
              <strong>{openOrder?.status ?? "YOK"}</strong>
            </div>
          </div>
          {salesMode === "package" ? (
            <div className="package-mode-grid">
              <div className="package-card selected"><b>Musteri</b><span>Misafir Musteri</span><small>Hizli kayit acik</small></div>
              <div className="package-card"><b>Telefon</b><span>+90 555 000 00 00</span><small>Son siparis 2 gun once</small></div>
              <div className="package-card wide"><b>Adres</b><span>Atasehir / Istanbul, Barbaros Mah. Mor Sumbul Sk.</span><small>Site girisi B blok, zil 14</small></div>
              <div className="package-card"><b>Teslimat</b><span>35 dk hedef sure</span><small>Hazirlaniyor</small></div>
              <div className="package-card"><b>Kurye</b><span>Motor 03</span><small>Bolge Atasehir merkez</small></div>
              <div className="package-card"><b>Kanal</b><span>Kurye / Gel-Al</span><small>Online odeme destekli</small></div>
            </div>
          ) : null}
          <div className="payment-panel-head">
            <div>
              <span>{paymentPanelLabel}</span>
              <strong>{paymentPanelHint}</strong>
            </div>
            <b>{remainingTotalLabel}</b>
          </div>
          <div className="pay-grid">
            <button
              className="payment-button pale"
              disabled={busy || openOrder == null || remainingTotal <= 0}
              onClick={() => void addRemainingPayment("CARD")}
            >
              Kredi Karti
            </button>
            <button className="payment-button pale" disabled>
              Ara Toplam
            </button>
            <button
              className="payment-button green"
              disabled={busy || openOrder == null || remainingTotal <= 0}
              onClick={() => void addRemainingPayment("CASH")}
            >
              Nakit Tahsil
            </button>
            <button
              className="payment-button orange"
              disabled={busy || openOrder == null || remainingTotal <= 0}
              onClick={() => void addRemainingPayment("CARD")}
            >
              Kart Tahsil
            </button>
          </div>
          <div className="items">
            {openOrder?.items?.length ? (
              openOrder.items.map((item) => (
                <div className="row order-item-row" key={item.id}>
                  <div className="order-item-main">
                    <b>{item.productName}</b>
                    <span>
                      {item.quantity} adet / {money.format(item.lineTotal)}
                    </span>
                  </div>
                  <div className="order-item-actions">
                    <button
                      type="button"
                      className="item-step"
                      disabled={busy || item.quantity <= 1}
                      onClick={() =>
                        void updateItemQuantity(item.id, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="item-step"
                      disabled={busy}
                      onClick={() =>
                        void updateItemQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="item-remove"
                      disabled={busy}
                      onClick={() => void removeItem(item.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty dark">
                Siparis eklemek icin sagdan urun sec
              </div>
            )}
          </div>
          <div className="payment-summary">
            <div className="summary-row">
              <span>Odenen</span>
              <strong>{paidTotalLabel}</strong>
            </div>
            <div className="summary-row">
              <span>Kalan</span>
              <strong>{remainingTotalLabel}</strong>
            </div>
          </div>
          <div className="pay-actions">
            <button
              className="payment-button pale wide"
              disabled={busy || openOrder == null || remainingTotal > 0}
              onClick={() => void closeCurrentOrder()}
            >
              {closeOrderLabel}
            </button>
          </div>
          <div className="total">Toplam: {currentTotalLabel}</div>
        </section>
      </section>
      <section className="grid">
        <div className={`panel product-panel ${salesMode}-mode`}>
          <div className="menu-toolbar">
            <div className="menu-toolbar-left channel-tabs">
              <button
                type="button"
                className={
                  salesMode === "quick" ? "channel-tab active" : "channel-tab"
                }
                onClick={() => setSalesMode("quick")}
              >
                Hizli Satis
              </button>
              <button
                type="button"
                className={
                  salesMode === "table" ? "channel-tab active" : "channel-tab"
                }
                onClick={() => setSalesMode("table")}
              >
                Masa
              </button>
              <button
                type="button"
                className={
                  salesMode === "package" ? "channel-tab active" : "channel-tab"
                }
                onClick={() => setSalesMode("package")}
              >
                Paket
              </button>
            </div>
            <div className="menu-toolbar-right">
              <button className="toolbar-icon-button" type="button">
                *
              </button>
              <button className="toolbar-lang" type="button">
                TR
              </button>
            </div>
          </div>
          <div className="sales-strip">
            <div className="sales-strip-copy">
              <span className="sales-strip-label">{salesModeLabel}</span>
              <strong>{channelContextLabel}</strong>
              <small>
                {openOrder ? "Adisyon acik" : "Yeni satis bekliyor"}
              </small>
            </div>
            <div className="sales-strip-totals">
              <div>
                <span>Kalan</span>
                <strong>{remainingTotalLabel}</strong>
              </div>
              <div>
                <span>Gunluk</span>
                <strong>{grossSalesLabel}</strong>
              </div>
            </div>
          </div>
          <div className="catalog-top">
            <button type="button" className="main-pill">
              {catalogPrimaryBadge}
            </button>
            <h2 className="catalog-title">{catalogTitle}</h2>
            <button type="button" className="ghost-pill">
              {salesMode === "package" ? "Kurye Hazirlari" : salesMode === "table" ? "Masa Setleri" : "Paketli Urunler"}
            </button>
            <button type="button" className="ghost-pill">
              {salesMode === "package" ? "Gel-Al Avantaji" : salesMode === "table" ? "Tatli Eslesmesi" : "Kampanya"}
            </button>
          </div>
          <div className="sub-tabs">
            <button
              type="button"
              className={activeSubTab === "primary" ? "sub-pill active" : "sub-pill"}
              onClick={() => setActiveSubTab("primary")}
            >
              {salesMode === "quick" ? "Atistirmaliklar" : salesMode === "table" ? "Masa Favorileri" : "Hazir Paketler"}
            </button>
            <button
              type="button"
              className={activeSubTab === "secondary" ? "sub-pill active" : "sub-pill"}
              onClick={() => setActiveSubTab("secondary")}
            >
              {salesMode === "quick" ? "Kahveler" : salesMode === "table" ? "Ikinci Tur" : "Sandvicler"}
            </button>
            <button
              type="button"
              className={activeSubTab === "tertiary" ? "sub-pill active" : "sub-pill"}
              onClick={() => setActiveSubTab("tertiary")}
            >
              {salesMode === "quick" ? "Bitki Caylari" : salesMode === "table" ? "Tatli" : "Icecekler"}
            </button>
            <button
              type="button"
              className={activeSubTab === "quaternary" ? "sub-pill active" : "sub-pill"}
              onClick={() => setActiveSubTab("quaternary")}
            >
              {salesMode === "quick" ? "Tatli" : salesMode === "table" ? "Ekstra" : "Promosyon"}
            </button>
          </div>
          <div className="menu-section">
            <h3>{activeSubTabLabel}</h3>
            <p className="menu-section-hint">{activeSubTabHint}</p>
            <div className="product-grid compact">
              {activeSubTabProducts.map(renderProductCard)}
            </div>
          </div>
        </div>
        <div className="panel kitchen-side">
          <h2>Mutfak</h2>
          {kitchen.length === 0 ? (
            <div className="empty">Aktif kalem yok</div>
          ) : (
            kitchen.map((item) => (
              <div className="row" key={item.id}>
                <b>{item.productName}</b>
                <span>
                  {item.quantity} adet / {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
