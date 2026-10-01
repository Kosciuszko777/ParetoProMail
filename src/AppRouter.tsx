import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ScrollToTop } from "./components/ScrollToTop";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePlan } from "@/hooks/usePlan";

import Index from "./pages/Index";
import PricingPage from "./pages/PricingPage";
import CreateNewsletter from "./pages/CreateNewsletter";
import ComposeIssue from "./pages/ComposeIssue";
import NewsletterPage from "./pages/NewsletterPage";
import NewsletterSettingsPage from "./pages/NewsletterSettingsPage";
import AllIssuesPage from "./pages/AllIssuesPage";
import DraftsPage from "./pages/DraftsPage";
import SubscribersPage from "./pages/SubscribersPage";
import AudiencePage from "./pages/AudiencePage";
import PaymentsPage from "./pages/PaymentsPage";
import ReferralsPage from "./pages/ReferralsPage";
import SettingsPage from "./pages/SettingsPage";
import IssuePage from "./pages/IssuePage";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

/**
 * After a brand-new keypair is created, the user must choose a plan before
 * entering the app. `markNeedsPlan()` (called in the signup flow) sets a flag;
 * this gate redirects to /pricing until a plan is chosen.
 */
function PlanGate() {
  const { user } = useCurrentUser();
  const { needsPlan } = usePlan(user?.pubkey);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && needsPlan && location.pathname !== "/pricing") {
      navigate("/pricing", { replace: true });
    }
  }, [user, needsPlan, location.pathname, navigate]);

  return null;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PlanGate />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/newsletter/new" element={<CreateNewsletter />} />
        <Route path="/newsletter/:pubkey/:slug" element={<NewsletterPage />} />
        <Route path="/newsletter/:pubkey/:slug/settings" element={<NewsletterSettingsPage />} />
        <Route path="/compose" element={<ComposeIssue />} />
        <Route path="/issues" element={<AllIssuesPage />} />
        <Route path="/drafts" element={<DraftsPage />} />
        <Route path="/subscribers" element={<SubscribersPage />} />
        <Route path="/audience" element={<AudiencePage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/issue/:pubkey/:slug" element={<IssuePage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
