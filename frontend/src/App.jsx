import { lazy, Suspense, useEffect, useRef } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK, startSmoothScroll, scrollToTop } from "./lib/motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
const Search = lazy(() => import("./pages/Search"));
const Offers = lazy(() => import("./pages/Offers"));
const Login = lazy(() => import("./pages/Login"));
const EmiPage = lazy(() => import("./pages/EmiPage"));
const CreditScore = lazy(() => import("./pages/CreditScore"));
const Support = lazy(() => import("./pages/Support"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Lenders = lazy(() => import("./pages/Lenders"));
const LenderDetail = lazy(() => import("./pages/LenderDetail"));

/** Generic scroll reveals for a page: [data-reveal] fades up, [data-stagger] cascades its children. */
function Reveals({ children }) {
  const scope = useRef(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray("[data-reveal]").forEach((el) => {
          gsap.from(el, { y: 36, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });
        gsap.utils.toArray("[data-stagger]").forEach((group) => {
          gsap.from(group.children, {
            y: 40, autoAlpha: 0, scale: 0.97, duration: 0.9, ease: "expo.out", stagger: 0.06,
            scrollTrigger: { trigger: group, start: "top 88%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope }
  );
  return <div ref={scope}>{children}</div>;
}

function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop();
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main id="main">
        <Suspense fallback={<div className="min-h-dvh" />}>
          <Reveals key={pathname}>
            <Outlet />
          </Reveals>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  useEffect(() => {
    const stop = startSmoothScroll();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return stop;
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="offers" element={<Offers />} />
        <Route path="login" element={<Login />} />
        <Route path="emi-calculator" element={<EmiPage />} />
        <Route path="credit-score" element={<CreditScore />} />
        <Route path="support" element={<Support />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="lenders" element={<Lenders />} />
        <Route path="lenders/:id" element={<LenderDetail />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
