import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import CreateNewsletter from "./pages/CreateNewsletter";
import ComposeIssue from "./pages/ComposeIssue";
import NewsletterPage from "./pages/NewsletterPage";
import SubscribePage from "./pages/SubscribePage";
import SubscribersPage from "./pages/SubscribersPage";
import AllIssuesPage from "./pages/AllIssuesPage";
import IssuePage from "./pages/IssuePage";
import NewsletterSettingsPage from "./pages/NewsletterSettingsPage";
import ScheduledMailsPage from "./pages/ScheduledMailsPage";
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
        <Route path="/subscribe/:pubkey/:slug" element={<SubscribePage />} />
        <Route path="/compose" element={<ComposeIssue />} />
        <Route path="/subscribers" element={<SubscribersPage />} />
        <Route path="/issues" element={<AllIssuesPage />} />
        <Route path="/issue/:id" element={<IssuePage />} />
        <Route path="/dispatches" element={<ScheduledMailsPage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
