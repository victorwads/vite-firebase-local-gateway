export const serviceRules = {
  reports: (domain) => domain.startsWith("reports"),
  firebaseTools: (domain, pathname) =>
    domain.startsWith("firebase") && pathname.startsWith("/tools"),
};

export const routeTable = {
  reports: "http://reports:3000",
  firebaseTools: "http://firebase:4000",
};
