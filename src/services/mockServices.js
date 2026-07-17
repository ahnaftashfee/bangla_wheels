export const makeService = (name, seed) => ({
  name,
  list: () => seed,
  get: (id) => seed.find((item) => item.id === id || item.slug === id),
  create: (item) => ({ id: `${name}-${Date.now()}`, createdAt: new Date().toISOString(), ...item }),
  update: (item, patch) => ({ ...item, ...patch, updatedAt: new Date().toISOString() }),
});

export const createPrototypeServices = (seed) => ({
  listingsService: makeService("listing", seed.listings),
  authService: {
    requestOtp: (phone) => ({ phone, otp: "123456", expiresIn: 180 }),
    verifyOtp: (phone, otp) => ({ ok: otp === "123456", phone }),
  },
  kycService: makeService("kyc", seed.kycRequests),
  auctionService: makeService("auction", seed.auctions),
  inspectionService: makeService("inspection", seed.inspections),
  warrantyService: makeService("warranty", seed.warranties),
  leadService: makeService("lead", seed.enquiries),
  notificationService: makeService("notification", seed.notifications),
  cmsService: makeService("article", seed.articles),
});
