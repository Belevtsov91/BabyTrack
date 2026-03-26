import { useEffect, useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import {
  getSessionRecapDismissedContext,
  setLastAppVisitAt,
} from "@/lib/appStorage";
import {
  buildSessionRecapSummary,
  hasHandledSessionEntry,
  markSessionEntryHandled,
} from "@/lib/sessionRecap";

function getNextPath(pathname: string, search: string, hash: string): string {
  const next = `${pathname}${search}${hash}`;
  return next.startsWith("/") ? next : "/";
}

export function SessionEntryGate() {
  const location = useLocation();
  const entryHandled = hasHandledSessionEntry();

  const summary = useMemo(
    () => (entryHandled ? null : buildSessionRecapSummary()),
    [entryHandled],
  );

  const dismissedContext = entryHandled ? null : getSessionRecapDismissedContext();
  const shouldRedirect = Boolean(summary && summary.contextKey !== dismissedContext);

  useEffect(() => {
    if (entryHandled || shouldRedirect) return;
    markSessionEntryHandled();
    setLastAppVisitAt(new Date().toISOString());
  }, [entryHandled, shouldRedirect]);

  if (!entryHandled && shouldRedirect && summary) {
    const next = getNextPath(location.pathname, location.search, location.hash);
    return (
      <Navigate
        to={`/session-recap?next=${encodeURIComponent(next)}`}
        replace
      />
    );
  }

  return <Outlet />;
}

export default SessionEntryGate;
