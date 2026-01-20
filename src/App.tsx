import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import Index from "./pages/Index";
import Standings from "./pages/Standings";
import Stats from "./pages/Stats";
import Salaries from "./pages/Salaries";
import Recaps from "./pages/Recaps";
import Constitution from "./pages/Constitution";
import TeamCaptains from "./pages/TeamCaptains";
import PracticeSquad from "./pages/PracticeSquad";
import CoachingCarousel from "./pages/CoachingCarousel";
import MeetTheLeague from "./pages/MeetTheLeague";
import Lore from "./pages/Lore";
import HistoricAnalytics from "./pages/HistoricAnalytics";
import Pantheon from "./pages/Pantheon";
import Manifesto from "./pages/Manifesto";
import Season2025 from "./pages/Season2025";
import RivalryWeek from "./pages/RivalryWeek";
import RookieDraft from "./pages/RookieDraft";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminTeams from "./pages/admin/Teams";
import AdminSeasons from "./pages/admin/Seasons";
import AdminStandings from "./pages/admin/Standings";
import AdminPlayoffs from "./pages/admin/Playoffs";
import AdminPlayerSalaries from "./pages/admin/PlayerSalaries";
import AdminBlog from "./pages/admin/Blog";
import AdminMedia from "./pages/admin/Media";
import AdminPages from "./pages/admin/Pages";
import AdminPantheon from "./pages/admin/PantheonAdmin";
import DynamicPage from "./pages/DynamicPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/salaries" element={<Salaries />} />
            <Route path="/recaps" element={<Recaps />} />
            <Route path="/constitution" element={<Constitution />} />
            <Route path="/team-captains" element={<TeamCaptains />} />
            <Route path="/practice-squad" element={<PracticeSquad />} />
            <Route path="/coaching-carousel" element={<CoachingCarousel />} />
            <Route path="/meet-the-league" element={<MeetTheLeague />} />
            <Route path="/lore" element={<Lore />} />
            <Route path="/historic-analytics" element={<HistoricAnalytics />} />
            <Route path="/pantheon" element={<Pantheon />} />
            <Route path="/manifesto" element={<Manifesto />} />
            <Route path="/season-2025" element={<Season2025 />} />
            <Route path="/rivalry-week" element={<RivalryWeek />} />
            <Route path="/rookie-draft" element={<RookieDraft />} />

            {/* Dynamic pages route */}
            <Route path="/pages/:slug" element={<DynamicPage />} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="teams" element={<AdminTeams />} />
              <Route path="seasons" element={<AdminSeasons />} />
              <Route path="standings" element={<AdminStandings />} />
              <Route path="playoffs" element={<AdminPlayoffs />} />
              <Route path="salaries" element={<AdminPlayerSalaries />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="pantheon" element={<AdminPantheon />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
