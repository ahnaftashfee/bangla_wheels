import { useEffect, useState } from "react";

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathname, search = ""] = raw.split("?");
  return {
    raw,
    pathname: pathname.startsWith("/") ? pathname : `/${pathname}`,
    search,
    query: new URLSearchParams(search),
  };
}

export function useRoute() {
  const [route, setRoute] = useState(parseRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}
