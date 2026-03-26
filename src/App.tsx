import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { PageTransition } from "@/components/layout/PageTransition";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SessionEntryGate } from "@/components/layout/SessionEntryGate";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { getAuthToken, isOnboarded, migrateLegacyStorageKeys } from "@/lib/appStorage";

// Auth
import Welcome from "./pages/auth/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/auth/Onboarding";
import ForgotPassword from "./pages/auth/ForgotPassword";
import SessionRecap from "./pages/entry/SessionRecap";
import { seedDemoData } from "./lib/seedData";

// Populate demo data on first load
migrateLegacyStorageKeys();
seedDemoData();

// Core
import Index from "./pages/Index";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SearchPage from "./pages/Search";

// Tracking
import AddEvent from "./pages/tracking/AddEvent";
import EventDetail from "./pages/tracking/EventDetail";
import Favorites from "./pages/tracking/Favorites";
import Calendar from "./pages/tracking/Calendar";
import Reminders from "./pages/tracking/Reminders";

// Health
import DoctorChat from "./pages/health/DoctorChat";
import DoctorVisits from "./pages/health/DoctorVisits";
import Vaccinations from "./pages/health/Vaccinations";
import Temperature from "./pages/health/Temperature";
import Allergens from "./pages/health/Allergens";
import GrowthCharts from "./pages/health/GrowthCharts";
import Medications from "./pages/health/Medications";

// Social
import Chat from "./pages/social/Chat";
import YearlyRecap from "./pages/social/YearlyRecap";

// Media
import PhotoDiary from "./pages/media/PhotoDiary";
import PdfReport from "./pages/media/PdfReport";

// Profile
import BabyProfileDetail from "./pages/profile/BabyProfileDetail";
import Milestones from "./pages/profile/Milestones";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getAuthToken();
  if (!token) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboarded = isOnboarded();
  if (!onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function ProtectedFlow() {
  return (
    <RequireAuth>
      <RequireOnboarding>
        <AppErrorBoundary>
          <Outlet />
        </AppErrorBoundary>
      </RequireOnboarding>
    </RequireAuth>
  );
}

function ProtectedShell() {
  return (
    <PageTransition>
      <Outlet />
    </PageTransition>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/onboarding"
                element={<RequireAuth><Onboarding /></RequireAuth>}
              />

              {/* Protected routes */}
              <Route element={<ProtectedFlow />}>
                <Route path="/session-recap" element={<SessionRecap />} />

                <Route element={<SessionEntryGate />}>
                  <Route element={<ProtectedShell />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/stats" element={<Stats />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/search" element={<SearchPage />} />

                    {/* Tracking */}
                    <Route path="/add" element={<AddEvent />} />
                    <Route path="/event/:eventType" element={<EventDetail />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/reminders" element={<Reminders />} />

                    {/* Health */}
                    <Route path="/doctor" element={<DoctorChat />} />
                    <Route path="/doctor-visits" element={<DoctorVisits />} />
                    <Route path="/vaccinations" element={<Vaccinations />} />
                    <Route path="/temperature" element={<Temperature />} />
                    <Route path="/allergens" element={<Allergens />} />
                    <Route path="/growth" element={<GrowthCharts />} />
                    <Route path="/medications" element={<Medications />} />

                    {/* Social */}
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/recap" element={<YearlyRecap />} />

                    {/* Media */}
                    <Route path="/photos" element={<PhotoDiary />} />
                    <Route path="/report" element={<PdfReport />} />

                    {/* Profile */}
                    <Route path="/baby-profile" element={<BabyProfileDetail />} />
                    <Route path="/milestones" element={<Milestones />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
