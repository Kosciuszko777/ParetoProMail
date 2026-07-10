import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import CreateNewsletter from "./pages/CreateNewsletter";
import ComposeIssue from "./pages/ComposeIssue";
import NewsletterPage from "./pages/NewsletterPage";
import NewsletterSettingsPage from "./pages/NewsletterSettingsPage";
import AllIssuesPage from "./pages/AllIssuesPage";
import DraftsPage from "./pages/DraftsPage";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/newsletter/new" element={<CreateNewsletter />} />
        <Route path="/newsletter/:pubkey/:slug" element={<NewsletterPage />} />
        <Route path="/newsletter/:pubkey/:slug/settings" element={<NewsletterSettingsPage />} />
        <Route path="/compose" element={<ComposeIssue />} />
        <Route path="/issues" element={<AllIssuesPage />} />
        <Route path="/drafts" element={<DraftsPage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
